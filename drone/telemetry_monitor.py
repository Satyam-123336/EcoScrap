"""
EcoScrap Drone — telemetry_monitor.py
Runs as a background thread.
Continuously reads MAVLink messages and maintains a live telemetry state dict.
Thread-safe — other modules read from self.state without locking.
"""

import os
os.environ["MAVLINK20"] = "1"

import threading
import time
import logging
import math                    # ← imported once at module level (not in hot loop)
from typing import Optional
from pymavlink import mavutil

import config

logger = logging.getLogger("TelemetryMonitor")


class TelemetryMonitor:
    """
    Background telemetry reader.
    Reads MAVLink messages from FC via the DroneController's mavlink connection.
    Provides a snapshot of the last known drone state to any caller.
    """

    def __init__(self, master: mavutil.mavlink_connection):
        """
        master: the pymavlink connection object from DroneController.
        Both DroneController and TelemetryMonitor share the same connection.
        """
        self._master  = master
        self._thread: Optional[threading.Thread] = None
        self._running = False
        self._last_msg_time = time.time()

        # ── Live State Dict ─────────────────────────────────────────────────────
        # Updated by background thread, read by safety manager and bridge server
        self.state = {
            "lat":              0.0,      # Decimal degrees
            "lon":              0.0,
            "altitude_m":       0.0,      # AGL (above ground level) in meters
            "heading_deg":      0.0,      # 0–360
            "speed_ms":         0.0,      # Horizontal ground speed m/s
            "battery_pct":      100,      # 0–100 %
            "battery_voltage":  11.1,     # Volts
            "battery_current":  0.0,      # Amps
            "mode":             "UNKNOWN",
            "armed":            False,
            "gps_fix":          0,        # 0=no fix, 2=2D, 3=3D
            "satellites":       0,
            "roll_deg":         0.0,
            "pitch_deg":        0.0,
            "distance_to_home": 0.0,     # metres — computed from GPS
            "telemetry_ok":     False,   # False if no message in last 8s
            "timestamp":        0.0,     # Unix timestamp of last update
            "last_statustext":  "",      # Latest FC STATUSTEXT message (pre-arm warnings, failsafe msgs)
            "last_statustext_sev": 6,
        }

    # ── Start / Stop ───────────────────────────────────────────────────────────

    def start(self):
        """Start background telemetry reader thread."""
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(
            target=self._reader_loop,
            daemon=True,
            name="TelemetryReader"
        )
        self._thread.start()
        logger.info("✅ Telemetry monitor started")

    def stop(self):
        """Stop background reader thread."""
        self._running = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=3)
        logger.info("Telemetry monitor stopped")

    # ── State Accessors ────────────────────────────────────────────────────────

    def get_state(self) -> dict:
        """Return a shallow copy of current telemetry state (thread-safe read)."""
        return dict(self.state)

    def is_telemetry_live(self) -> bool:
        """Returns True if we received a message within TELEMETRY_TIMEOUT_S."""
        return (time.time() - self._last_msg_time) < config.TELEMETRY_TIMEOUT_S

    def is_battery_critical(self) -> bool:
        return self.state["battery_pct"] <= config.BATTERY_RTL_PCT

    def is_battery_emergency(self) -> bool:
        return self.state["battery_pct"] <= config.BATTERY_LAND_PCT

    def has_gps_fix(self) -> bool:
        return (self.state["gps_fix"] >= config.MIN_GPS_FIX and
                self.state["satellites"] >= config.MIN_GPS_SATS)

    # ── Background Reader Loop ─────────────────────────────────────────────────

    def _reader_loop(self):
        """
        Runs forever in background thread.
        Reads MAVLink messages and updates self.state.
        """
        logger.info("Telemetry reader thread running...")
        while self._running:
            try:
                msg = self._master.recv_match(blocking=False)
                if msg is None:
                    time.sleep(0.02)  # 50Hz max poll rate
                    continue

                msg_type = msg.get_type()
                self._last_msg_time = time.time()

                if msg_type == "GLOBAL_POSITION_INT":
                    raw_lat = msg.lat / 1e7
                    raw_lon = msg.lon / 1e7
                    # Only overwrite lat/lon if the FC actually has valid non-zero GPS fix
                    if raw_lat != 0.0 and raw_lon != 0.0:
                        self.state["lat"] = raw_lat
                        self.state["lon"] = raw_lon
                    self.state["altitude_m"]   = msg.relative_alt / 1000.0
                    self.state["heading_deg"]  = msg.hdg / 100.0 if msg.hdg != 65535 else 0.0
                    # Speed from velocity components
                    vx = msg.vx / 100.0
                    vy = msg.vy / 100.0
                    self.state["speed_ms"] = math.sqrt(vx**2 + vy**2)
                    self.state["timestamp"]    = time.time()
                    self.state["telemetry_ok"] = True

                    # Compute distance from base (haversine inline — no import overhead)
                    lat2, lon2 = config.BASE_LAT, config.BASE_LON
                    lat1, lon1 = self.state["lat"], self.state["lon"]
                    if lat1 != 0.0 and lon1 != 0.0:
                        R = 6371000
                        phi1, phi2 = math.radians(lat1), math.radians(lat2)
                        dphi = math.radians(lat2 - lat1)
                        dlam = math.radians(lon2 - lon1)
                        a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
                        self.state["distance_to_home"] = R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
                    else:
                        self.state["distance_to_home"] = 0.0

                elif msg_type == "SYS_STATUS":
                    self.state["battery_pct"]     = max(0, msg.battery_remaining)
                    self.state["battery_voltage"] = msg.voltage_battery / 1000.0  # mV → V
                    self.state["battery_current"] = msg.current_battery / 100.0   # cA → A

                elif msg_type == "HEARTBEAT":
                    self.state["armed"] = bool(
                        msg.base_mode & mavutil.mavlink.MAV_MODE_FLAG_SAFETY_ARMED
                    )
                    # Decode mode name
                    try:
                        mode_map = {v: k for k, v in self._master.mode_mapping().items()}
                        self.state["mode"] = mode_map.get(msg.custom_mode, "UNKNOWN")
                    except Exception:
                        pass

                elif msg_type == "GPS_RAW_INT":
                    self.state["gps_fix"]    = msg.fix_type
                    self.state["satellites"] = msg.satellites_visible

                elif msg_type == "ATTITUDE":
                    self.state["roll_deg"]  = math.degrees(msg.roll)
                    self.state["pitch_deg"] = math.degrees(msg.pitch)

                elif msg_type == "STATUSTEXT":
                    raw_text = getattr(msg, "text", "")
                    if isinstance(raw_text, bytes):
                        raw_text = raw_text.decode("utf-8", errors="replace")
                    text = raw_text.strip("\x00 \t\r\n")
                    sev = getattr(msg, "severity", 6)
                    # ArduPilot severities: 0=EMERGENCY, 1=ALERT, 2=CRITICAL, 3=ERROR, 4=WARNING, 5=NOTICE, 6=INFO, 7=DEBUG
                    if sev <= 3:
                        logger.error(f"🚨 [FC STATUSTEXT] {text}")
                    elif sev == 4:
                        logger.warning(f"⚠️  [FC STATUSTEXT] {text}")
                    else:
                        logger.info(f"📢 [FC STATUSTEXT] {text}")
                    self.state["last_statustext"] = text
                    self.state["last_statustext_sev"] = sev

            except Exception as e:
                logger.warning(f"Telemetry read error: {e}")
                time.sleep(0.1)

        # Mark telemetry as dead when thread stops
        self.state["telemetry_ok"] = False
