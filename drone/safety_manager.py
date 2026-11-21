"""
EcoScrap Drone — safety_manager.py
Wraps DroneController with pre-flight checks and in-flight watchdogs.
Every mission must pass through safety_manager before any command is sent.

Watchdogs run as daemon threads — they silently trigger RTL or emergency land
if safety thresholds are breached during flight.
"""

import threading
import time
import logging
from typing import List, Tuple, TYPE_CHECKING

import config

if TYPE_CHECKING:
    from drone_controller import DroneController
    from telemetry_monitor import TelemetryMonitor

logger = logging.getLogger("SafetyManager")


class SafetyManager:
    """
    Pre-flight gate + in-flight watchdog system.

    pre_flight_check()  → call before arming, returns (ok, [failed_reasons])
    start_watchdogs()   → call after takeoff
    stop_watchdogs()    → call after landing/RTL
    """

    def __init__(self,
                 drone: "DroneController",
                 telemetry: "TelemetryMonitor"):
        self._drone     = drone
        self._telemetry = telemetry
        self._watchdog_thread: threading.Thread = None
        self._watchdogs_running = False

    # ── Pre-Flight Check ───────────────────────────────────────────────────────

    def pre_flight_check(self) -> Tuple[bool, List[str]]:
        """
        Run all safety checks before arming.
        Returns (all_passed: bool, list_of_failed_checks: List[str])

        Checks:
        - Telemetry link is live
        - GPS 3D fix with enough satellites
        - Battery above minimum start threshold
        - Drone not already armed
        - FC is connected
        """
        failures = []
        state    = self._telemetry.get_state()

        logger.info("=" * 50)
        logger.info("PRE-FLIGHT SAFETY CHECK")
        logger.info("=" * 50)

        # 1. Telemetry link
        if not self._telemetry.is_telemetry_live():
            failures.append("Telemetry link is not live — check ESP32 wiring")
        else:
            logger.info("✅ Telemetry: LIVE")

        # 2. GPS fix
        gps_fix  = state.get("gps_fix", 0)
        sats     = state.get("satellites", 0)
        if gps_fix < config.MIN_GPS_FIX:
            failures.append(f"GPS fix insufficient: {gps_fix} (need {config.MIN_GPS_FIX}=3D fix)")
        elif sats < config.MIN_GPS_SATS:
            failures.append(f"Not enough satellites: {sats} (need {config.MIN_GPS_SATS})")
        else:
            logger.info(f"✅ GPS: 3D fix, {sats} satellites")

        # 3. Battery level
        batt = state.get("battery_pct", 0)
        if batt < config.PRE_FLIGHT_MIN_BATT:
            failures.append(f"Battery too low: {batt}% (need ≥{config.PRE_FLIGHT_MIN_BATT}%)")
        else:
            logger.info(f"✅ Battery: {batt}% ({state.get('battery_voltage', 0):.2f}V)")

        # 4. Not already armed
        if state.get("armed", False):
            failures.append("Motors are already armed — disarm before starting mission")
        else:
            logger.info("✅ Motors: Disarmed (safe)")

        # 5. FC connection
        if not self._drone.is_connected():
            failures.append("Flight controller not connected")
        else:
            logger.info("✅ FC connection: Active")

        # 6. Current mode should not be RTL/LAND (indicates previous emergency)
        mode = state.get("mode", "")
        if mode in ("RTL", "LAND"):
            failures.append(f"FC is in {mode} mode — resolve before new mission")
        elif mode:
            logger.info(f"✅ Flight mode: {mode}")

        # Summary
        if failures:
            logger.error("❌ PRE-FLIGHT CHECK FAILED:")
            for f in failures:
                logger.error(f"   • {f}")
        else:
            logger.info("✅ ALL PRE-FLIGHT CHECKS PASSED — Ready to fly")

        logger.info("=" * 50)
        return (len(failures) == 0, failures)

    # ── In-Flight Watchdogs ────────────────────────────────────────────────────

    def start_watchdogs(self):
        """Start background safety watchdog thread after takeoff."""
        if self._watchdogs_running:
            return
        self._watchdogs_running = True
        self._watchdog_thread = threading.Thread(
            target=self._watchdog_loop,
            daemon=True,
            name="SafetyWatchdog"
        )
        self._watchdog_thread.start()
        logger.info("🛡️  Safety watchdogs active")

    def stop_watchdogs(self):
        """Stop watchdog thread after mission completes."""
        self._watchdogs_running = False
        logger.info("🛡️  Safety watchdogs stopped")

    def _watchdog_loop(self):
        """
        Runs every 1 second.
        Checks battery, telemetry loss, geofence — triggers RTL if violated.
        """
        while self._watchdogs_running:
            try:
                state = self._telemetry.get_state()

                # 1. Telemetry loss watchdog
                if not self._telemetry.is_telemetry_live():
                    logger.critical("🚨 WATCHDOG: Telemetry lost! Triggering RTL")
                    self._drone.return_to_launch()
                    # Wait 5s then check again; if still lost, emergency land
                    time.sleep(5)
                    if not self._telemetry.is_telemetry_live():
                        logger.critical("🚨 WATCHDOG: Still no telemetry — Emergency Land")
                        self._drone.land()

                # 2. Battery RTL watchdog
                elif self._telemetry.is_battery_emergency():
                    batt = state.get("battery_pct", 0)
                    logger.critical(f"🚨 WATCHDOG: Battery CRITICAL ({batt}%) — Emergency Land NOW")
                    self._drone.land()

                elif self._telemetry.is_battery_critical():
                    batt = state.get("battery_pct", 0)
                    logger.warning(f"⚠️  WATCHDOG: Low battery ({batt}%) — Triggering RTL")
                    self._drone.return_to_launch()

                # 3. Geofence watchdog
                else:
                    dist = state.get("distance_to_home", 0)
                    if dist > config.GEOFENCE_RADIUS_M:
                        logger.critical(
                            f"🚨 WATCHDOG: Geofence breach! "
                            f"Drone is {dist:.0f}m from base "
                            f"(max={config.GEOFENCE_RADIUS_M}m) — RTL"
                        )
                        self._drone.return_to_launch()

            except Exception as e:
                logger.error(f"Watchdog loop error: {e}")

            time.sleep(1.0)

    # ── Status ─────────────────────────────────────────────────────────────────

    def get_status(self) -> dict:
        state = self._telemetry.get_state()
        return {
            "watchdogs_active":   self._watchdogs_running,
            "telemetry_live":     self._telemetry.is_telemetry_live(),
            "battery_critical":   self._telemetry.is_battery_critical(),
            "battery_emergency":  self._telemetry.is_battery_emergency(),
            "gps_ok":             self._telemetry.has_gps_fix(),
            "distance_from_base": state.get("distance_to_home", 0),
            "geofence_radius_m":  config.GEOFENCE_RADIUS_M,
        }
