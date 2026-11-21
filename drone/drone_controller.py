"""
EcoScrap Drone — drone_controller.py
Core MAVLink command interface for the Cross Flight Controller.
Connects via pymavlink through the ESP32 Ground Unit (COM port).

All drone actions go through this class. 
Safety checks are enforced by safety_manager.py before calling these.
"""

import os
os.environ["MAVLINK20"] = "1"  # Force MAVLink 2.0 dialect before importing pymavlink

import time
import math
import threading
import logging
from typing import Optional
from pymavlink import mavutil

import config

logger = logging.getLogger("DroneController")


class DroneController:
    """
    Low-level MAVLink interface.
    Wraps pymavlink with clean, named methods for each drone action.
    """

    def __init__(self):
        self.master: Optional[mavutil.mavlink_connection] = None
        self.telemetry = None                # TelemetryMonitor reference for thread-safe state access
        self._connected  = False
        self._lock       = threading.Lock()   # Thread-safe command dispatch
        self.home_lat: Optional[float] = None
        self.home_lon: Optional[float] = None
        self._heartbeat_thread: Optional[threading.Thread] = None
        self._heartbeat_running: bool = False

    # ── Connection ──────────────────────────────────────────────────────────────

    def connect(self) -> bool:
        """
        Open MAVLink connection to FC via ground ESP32 COM port.
        Waits for first heartbeat to confirm link is live.
        """
        try:
            logger.info(f"Connecting to FC on {config.DRONE_SERIAL_PORT} @ {config.DRONE_BAUD_RATE} baud (MAVLink 2.0)...")
            self.master = mavutil.mavlink_connection(
                config.DRONE_SERIAL_PORT,
                baud=config.DRONE_BAUD_RATE,
                autoreconnect=True,
                source_system=255,    # GCS system ID
                source_component=mavutil.mavlink.MAV_COMP_ID_MISSIONPLANNER  # 190: Authentic GCS component ID
            )

            logger.info("Waiting for heartbeat from FC...")
            heartbeat = self.master.wait_heartbeat(timeout=config.MAVLINK_CONNECT_TIMEOUT_S)

            if heartbeat is None:
                logger.error("No heartbeat received — check wiring and firmware")
                return False

            logger.info(
                f"✅ FC connected! "
                f"System ID: {self.master.target_system}, "
                f"Component: {self.master.target_component}"
            )
            self._connected = True

            # Start continuous 1Hz GCS Heartbeat emitter thread
            # Critical: ArduPilot GCS Failsafe (FS_GCS_ENABLE) triggers if no GCS heartbeat
            # is received for 5s, causing yellow blinking LED and rejecting GUIDED mode.
            self._heartbeat_running = True
            self._heartbeat_thread = threading.Thread(
                target=self._heartbeat_loop,
                daemon=True,
                name="GCSHeartbeatEmitter"
            )
            self._heartbeat_thread.start()

            # Set default stream rates (telemetry messages we want)
            self._request_data_streams()

            # Synchronize system time (helps EKF align timestamp)
            try:
                self.master.mav.system_time_send(int(time.time() * 1e6), 0)
            except Exception:
                pass

            # Trigger flight controller pre-arm checks so any warnings are broadcast
            try:
                self.master.mav.command_long_send(
                    self.master.target_system,
                    self.master.target_component,
                    mavutil.mavlink.MAV_CMD_RUN_PREARM_CHECKS,
                    0, 0, 0, 0, 0, 0, 0, 0
                )
            except Exception:
                pass

            return True

        except Exception as e:
            logger.error(f"Connection failed: {e}")
            return False

    def _heartbeat_loop(self):
        """
        Continuously emit GCS Heartbeat at 1 Hz.
        ArduPilot's GCS failsafe (FS_GCS_ENABLE) triggers if no GCS heartbeat is
        received for 5 seconds, causing pre-arm check failure (flashing YELLOW LED)
        and rejecting GUIDED mode.
        Emitting this 1 Hz heartbeat clears GCS failsafe and turns the LED GREEN (Ready to Arm),
        matching Mission Planner's exact behavior.
        """
        logger.info("💓 GCS Heartbeat emitter active (1 Hz) — GCS failsafe cleared")
        while self._connected and self._heartbeat_running:
            try:
                with self._lock:
                    if self.master:
                        self.master.mav.heartbeat_send(
                            mavutil.mavlink.MAV_TYPE_GCS,
                            mavutil.mavlink.MAV_AUTOPILOT_INVALID,
                            mavutil.mavlink.MAV_MODE_FLAG_SAFETY_ARMED if self.is_armed() else 0,
                            0,
                            mavutil.mavlink.MAV_STATE_ACTIVE
                        )
            except Exception as e:
                logger.debug(f"Heartbeat send error: {e}")
            time.sleep(1.0)
        logger.info("Heartbeat loop stopped")

    def disconnect(self):
        """Close MAVLink connection gracefully."""
        self._heartbeat_running = False
        if self.master:
            try:
                self.master.close()
            except Exception:
                pass
        self._connected = False
        logger.info("Disconnected from FC")

    def is_connected(self) -> bool:
        return self._connected and self.master is not None

    def _request_data_streams(self):
        """
        Ask FC to stream telemetry at desired rates.
        ArduCopter responds with MAVLink messages at these Hz.
        """
        if not self.master:
            return
        streams = [
            (mavutil.mavlink.MAV_DATA_STREAM_ALL,      4),   # All streams at 4 Hz
            (mavutil.mavlink.MAV_DATA_STREAM_POSITION, 5),   # GPS at 5 Hz
            (mavutil.mavlink.MAV_DATA_STREAM_RAW_SENSORS, 2),
            (mavutil.mavlink.MAV_DATA_STREAM_EXTENDED_STATUS, 2),
        ]
        for stream_id, rate_hz in streams:
            self.master.mav.request_data_stream_send(
                self.master.target_system,
                self.master.target_component,
                stream_id,
                rate_hz,
                1   # 1 = start streaming
            )
        logger.debug("Data streams requested")

    # ── Mode Control ────────────────────────────────────────────────────────────

    def set_mode(self, mode_name: str) -> bool:
        """
        Set ArduCopter flight mode by name.
        Valid modes: GUIDED, AUTO, LOITER, RTL, LAND, STABILIZE
        """
        if not self._connected:
            return False

        mode_id = self.master.mode_mapping().get(mode_name.upper())
        if mode_id is None:
            logger.error(f"Unknown mode: {mode_name}")
            return False

        with self._lock:
            self.master.mav.set_mode_send(
                self.master.target_system,
                mavutil.mavlink.MAV_MODE_FLAG_CUSTOM_MODE_ENABLED,
                mode_id
            )

        # Confirm mode was set — read from TelemetryMonitor state (non-competing)
        # Avoids race condition with TelemetryMonitor's recv_match() thread
        for _ in range(20):
            time.sleep(0.5)
            if hasattr(self, "telemetry") and self.telemetry:
                current_mode = self.telemetry.state.get("mode", "")
                if current_mode.upper() == mode_name.upper():
                    logger.info(f"✅ Mode set to {mode_name}")
                    return True
            else:
                # Fallback: direct recv if telemetry not running yet
                msg = self.master.recv_match(type='HEARTBEAT', blocking=True, timeout=1)
                if msg and msg.custom_mode == mode_id:
                    logger.info(f"✅ Mode set to {mode_name}")
                    return True

        logger.error(f"Failed to confirm mode change to {mode_name}")
        return False

    # ── Arming ──────────────────────────────────────────────────────────────────

    def arm(self, force: bool = False) -> bool:
        """
        Arm the motors. Requires GUIDED mode and pre-arm checks passing.
        force=True bypasses some safety checks (use only in emergencies).
        """
        if not self._connected:
            return False

        logger.info("Arming motors...")
        param = 21761 if force else 0   # 21761 = force arm magic number in ArduCopter

        with self._lock:
            self.master.mav.command_long_send(
                self.master.target_system,
                self.master.target_component,
                mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM,
                0,      # confirmation
                1,      # param1: 1=arm, 0=disarm
                param,  # param2: force flag
                0, 0, 0, 0, 0
            )

        # Wait for arm confirmation — read from TelemetryMonitor state (non-competing)
        for _ in range(30):
            time.sleep(0.5)
            if hasattr(self, "telemetry") and self.telemetry:
                if self.telemetry.state.get("armed", False):
                    logger.info("✅ Motors armed successfully")
                    return True
            else:
                msg = self.master.recv_match(type='HEARTBEAT', blocking=True, timeout=1)
                if msg:
                    armed = (msg.base_mode & mavutil.mavlink.MAV_MODE_FLAG_SAFETY_ARMED) != 0
                    if armed:
                        logger.info("✅ Motors armed successfully")
                        return True

        logger.error("❌ Arm failed — check pre-arm conditions in Mission Planner")
        return False

    def disarm(self) -> bool:
        """Disarm the motors (safe to call after landing)."""
        if not self._connected:
            return False

        with self._lock:
            self.master.mav.command_long_send(
                self.master.target_system,
                self.master.target_component,
                mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM,
                0, 0, 0, 0, 0, 0, 0, 0
            )

        logger.info("Disarm command sent")
        return True

    def is_armed(self) -> bool:
        """Check if motors are currently armed via TelemetryMonitor state."""
        if hasattr(self, "telemetry") and self.telemetry:
            return self.telemetry.state.get("armed", False)
        if not self.master:
            return False
        msg = self.master.recv_match(type='HEARTBEAT', blocking=True, timeout=2)
        if msg:
            return (msg.base_mode & mavutil.mavlink.MAV_MODE_FLAG_SAFETY_ARMED) != 0
        return False

    # ── Takeoff ─────────────────────────────────────────────────────────────────

    def takeoff(self, altitude_m: float = None) -> bool:
        """
        Command takeoff in GUIDED mode.
        Records home position (base lat/lon) for RTL reference.
        Blocks until drone reaches target altitude (±1m).
        """
        if not self._connected:
            return False

        altitude_m = altitude_m or config.TAKEOFF_ALTITUDE_M

        # Save home coordinates from current GPS fix
        gps = self._get_gps_position()
        if gps:
            self.home_lat = gps[0]
            self.home_lon = gps[1]
            logger.info(f"Home position recorded: {self.home_lat:.6f}, {self.home_lon:.6f}")

        logger.info(f"Taking off to {altitude_m}m...")

        with self._lock:
            self.master.mav.command_long_send(
                self.master.target_system,
                self.master.target_component,
                mavutil.mavlink.MAV_CMD_NAV_TAKEOFF,
                0,           # confirmation
                0, 0, 0, 0,  # unused params
                0, 0,        # lat, lon (use current position)
                altitude_m   # target altitude in meters
            )

        # Wait until altitude reached
        timeout = time.time() + 45  # 45 second takeoff timeout
        while time.time() < timeout:
            msg = self.master.recv_match(type='GLOBAL_POSITION_INT', blocking=True, timeout=2)
            if msg:
                current_alt = msg.relative_alt / 1000.0  # mm → m
                logger.debug(f"  Altitude: {current_alt:.1f}m / {altitude_m}m")
                if current_alt >= (altitude_m - 1.0):
                    logger.info(f"✅ Takeoff complete — altitude {current_alt:.1f}m")
                    return True
            time.sleep(0.5)

        logger.error("❌ Takeoff timeout — drone may not have lifted")
        return False

    # ── Navigation ──────────────────────────────────────────────────────────────

    def goto_location(self, lat: float, lon: float, alt_m: float = None,
                      timeout_s: int = None) -> bool:
        """
        Fly to a GPS coordinate in GUIDED mode.
        Blocks until drone is within POSITION_HOLD_RADIUS of target.
        """
        if not self._connected:
            return False

        alt_m = alt_m or config.CRUISE_ALTITUDE_M
        timeout_s = timeout_s or config.WAYPOINT_TIMEOUT_S

        logger.info(f"Flying to: lat={lat:.6f}, lon={lon:.6f}, alt={alt_m}m")

        # SET_POSITION_TARGET_GLOBAL_INT — GUIDED mode goto
        last_send_time = 0.0

        # Wait until within target radius
        deadline = time.time() + timeout_s
        while time.time() < deadline:
            now = time.time()
            # Stream position target command every 2.0s to ensure zero dropped packets
            if (now - last_send_time) >= 2.0:
                with self._lock:
                    self.master.mav.set_position_target_global_int_send(
                        0,                          # time_boot_ms (unused)
                        self.master.target_system,
                        self.master.target_component,
                        mavutil.mavlink.MAV_FRAME_GLOBAL_RELATIVE_ALT_INT,
                        0b0000111111111000,         # type_mask: enable position only
                        int(lat * 1e7),            # lat in degrees * 1e7
                        int(lon * 1e7),            # lon in degrees * 1e7
                        alt_m,                     # altitude in meters (AGL)
                        0, 0, 0,                   # velocity xyz (unused)
                        0, 0, 0,                   # acceleration xyz (unused)
                        0, 0                       # yaw, yaw_rate (unused)
                    )
                last_send_time = now

            pos = self._get_gps_position()
            if pos:
                dist = self._haversine_distance(pos[0], pos[1], lat, lon)
                logger.debug(f"  Distance to target: {dist:.1f}m")
                if dist <= config.POSITION_HOLD_RADIUS:
                    logger.info(f"✅ Reached target location (dist={dist:.1f}m)")
                    return True
            time.sleep(config.STATUS_CHECK_INTERVAL_S)

        logger.error(f"❌ Navigation timeout after {timeout_s}s")
        return False

    def set_speed(self, speed_ms: float) -> bool:
        """Set horizontal cruise speed in m/s."""
        if not self._connected:
            return False

        with self._lock:
            self.master.mav.command_long_send(
                self.master.target_system,
                self.master.target_component,
                mavutil.mavlink.MAV_CMD_DO_CHANGE_SPEED,
                0,
                0,          # 0=airspeed, 1=groundspeed
                speed_ms,   # speed in m/s
                -1,         # throttle (-1 = no change)
                0, 0, 0, 0
            )
        return True

    # ── Hover / Loiter ──────────────────────────────────────────────────────────

    def loiter(self) -> bool:
        """
        Switch to LOITER mode — drone holds GPS position automatically.
        Used at pickup location while waiting for user.
        """
        return self.set_mode("LOITER")

    # ── Servo Control (Collection Mechanism) ───────────────────────────────────

    def set_servo(self, channel: int, pwm_us: int) -> bool:
        """
        Set a servo/aux channel to a PWM value (microseconds).
        Used to control winch and latch servos.
        channel: ArduCopter servo channel (e.g., 9, 10)
        pwm_us: 1000–2000 (typical servo range)
        """
        if not self._connected:
            return False

        with self._lock:
            self.master.mav.command_long_send(
                self.master.target_system,
                self.master.target_component,
                mavutil.mavlink.MAV_CMD_DO_SET_SERVO,
                0,
                float(channel),  # servo number
                float(pwm_us),   # PWM value
                0, 0, 0, 0, 0
            )

        logger.debug(f"Servo CH{channel} → {pwm_us}µs")
        return True

    def lower_bag(self) -> bool:
        """
        Lower collection bag by running winch servo forward.
        Runs for WINCH_LOWER_DURATION_S seconds then stops.
        """
        logger.info("⬇️  Lowering bag...")
        self.set_servo(config.WINCH_SERVO_CHANNEL, config.WINCH_LOWER_PWM)
        time.sleep(config.WINCH_LOWER_DURATION_S)
        self.set_servo(config.WINCH_SERVO_CHANNEL, config.WINCH_STOP_PWM)
        logger.info("✅ Bag lowered — waiting for user to load items")
        return True

    def raise_bag(self) -> bool:
        """
        Raise collection bag by running winch servo in reverse.
        Runs for WINCH_RAISE_DURATION_S seconds then stops.
        """
        logger.info("⬆️  Raising bag with items...")
        self.set_servo(config.WINCH_SERVO_CHANNEL, config.WINCH_RAISE_PWM)
        time.sleep(config.WINCH_RAISE_DURATION_S)
        self.set_servo(config.WINCH_SERVO_CHANNEL, config.WINCH_STOP_PWM)
        logger.info("✅ Bag raised — items secured")
        return True

    def release_bag_at_depot(self) -> bool:
        """
        Open latch servo at depot to drop items into collection bin.
        Then close latch to secure for return trip.
        """
        logger.info("📦 Releasing items at depot...")
        self.set_servo(config.LATCH_SERVO_CHANNEL, config.LATCH_OPEN_PWM)
        time.sleep(config.DEPOT_DROP_WAIT_S)
        # Lower bag to ensure items fall out
        self.set_servo(config.WINCH_SERVO_CHANNEL, config.WINCH_LOWER_PWM)
        time.sleep(2.0)
        self.set_servo(config.WINCH_SERVO_CHANNEL, config.WINCH_STOP_PWM)
        # Close latch
        self.set_servo(config.LATCH_SERVO_CHANNEL, config.LATCH_CLOSE_PWM)
        # Raise empty bag
        self.set_servo(config.WINCH_SERVO_CHANNEL, config.WINCH_RAISE_PWM)
        time.sleep(config.WINCH_RAISE_DURATION_S)
        self.set_servo(config.WINCH_SERVO_CHANNEL, config.WINCH_STOP_PWM)
        logger.info("✅ Items deposited at depot")
        return True

    # ── Return & Land ───────────────────────────────────────────────────────────

    def return_to_launch(self) -> bool:
        """Command RTL mode — drone flies home and lands automatically."""
        logger.info("🏠 RTL commanded — returning to base...")
        return self.set_mode("RTL")

    def land(self) -> bool:
        """Command LAND mode at current position."""
        logger.info("🛬 Landing...")
        return self.set_mode("LAND")

    def emergency_stop(self) -> bool:
        """
        Emergency disarm — cuts motors immediately regardless of altitude.
        USE ONLY IN ABSOLUTE EMERGENCY — drone will fall.
        ArduCopter force-disarm: MAV_CMD_COMPONENT_ARM_DISARM with param1=0, param2=21196
        """
        logger.critical("🚨 EMERGENCY STOP — DISARMING MOTORS NOW")
        with self._lock:
            self.master.mav.command_long_send(
                self.master.target_system,
                self.master.target_component,
                mavutil.mavlink.MAV_CMD_COMPONENT_ARM_DISARM,
                0,     # confirmation
                0,     # param1: 0 = DISARM
                21196, # param2: magic force-disarm value (ArduCopter specific)
                0, 0, 0, 0, 0
            )
        return True

    def wait_for_landing(self, timeout_s: int = 120) -> bool:
        """
        Block until drone altitude is below LAND_DETECT_ALT_M.
        Signals that the drone has landed safely.
        Reads from TelemetryMonitor state (non-competing with reader thread).
        """
        logger.info("Waiting for landing completion...")
        deadline = time.time() + timeout_s
        while time.time() < deadline:
            # Prefer TelemetryMonitor state (thread-safe, non-competing)
            if hasattr(self, "telemetry") and self.telemetry:
                alt = self.telemetry.state.get("altitude_m", 999.0)
            else:
                msg = self.master.recv_match(type='GLOBAL_POSITION_INT', blocking=True, timeout=2)
                alt = (msg.relative_alt / 1000.0) if msg else 999.0
            logger.debug(f"  Altitude: {alt:.2f}m")
            if alt < config.LAND_DETECT_ALT_M:
                logger.info("✅ Drone has landed")
                return True
            time.sleep(0.5)
        logger.error("Landing timeout")
        return False

    # ── Telemetry Helpers ───────────────────────────────────────────────────────

    def _get_gps_position(self) -> Optional[tuple]:
        """Return (lat, lon, alt) from TelemetryMonitor state or latest GLOBAL_POSITION_INT."""
        if hasattr(self, "telemetry") and self.telemetry:
            st = self.telemetry.get_state()
            if st.get("lat", 0.0) != 0.0 and st.get("lon", 0.0) != 0.0:
                return (st["lat"], st["lon"], st.get("altitude_m", 0.0))
        if not self.master:
            return None
        msg = self.master.recv_match(type='GLOBAL_POSITION_INT', blocking=True, timeout=2)
        if msg:
            return (msg.lat / 1e7, msg.lon / 1e7, msg.relative_alt / 1000.0)
        return None

    def get_battery_level(self) -> Optional[int]:
        """Return battery percentage (0-100), or None if unavailable."""
        if not self.master:
            return None
        msg = self.master.recv_match(type='SYS_STATUS', blocking=True, timeout=2)
        if msg:
            return msg.battery_remaining  # percent
        return None

    def get_mode(self) -> Optional[str]:
        """Return current flight mode name string via TelemetryMonitor state."""
        if hasattr(self, "telemetry") and self.telemetry:
            return self.telemetry.state.get("mode", "UNKNOWN")
        if not self.master:
            return None
        msg = self.master.recv_match(type='HEARTBEAT', blocking=True, timeout=2)
        if msg:
            mode_map = {v: k for k, v in self.master.mode_mapping().items()}
            return mode_map.get(msg.custom_mode, "UNKNOWN")
        return None

    # ── Static Math ─────────────────────────────────────────────────────────────

    @staticmethod
    def _haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate great-circle distance between two GPS points in meters.
        Standard haversine formula.
        """
        R = 6371000  # Earth radius in meters
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlam = math.radians(lon2 - lon1)
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
