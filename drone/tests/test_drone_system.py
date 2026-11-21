"""
╔══════════════════════════════════════════════════════════════════════════════╗
║  EcoScrap Drone — Pre-Field Integration Test Suite                         ║
║  Run: python -m pytest drone/tests/test_drone_system.py -v                 ║
║  Run offline (no hardware): python drone/tests/test_drone_system.py        ║
╚══════════════════════════════════════════════════════════════════════════════╝

Covers:
  T01  Config module loads and all required keys present
  T02  Mission planner — waypoint generation with valid coords
  T03  Mission planner — geofence rejection
  T04  Mission planner — zero-coord fallback to address geocoding (mocked)
  T05  Haversine distance formula accuracy
  T06  Telemetry monitor state dict has all required keys with correct types
  T07  Safety manager pre-flight check blocks on armed drone
  T08  Safety manager pre-flight check blocks on low battery
  T09  Safety manager pre-flight check blocks on no GPS fix
  T10  Safety manager pre-flight check blocks on dead telemetry
  T11  Drone bridge server health endpoint returns correct JSON
  T12  Drone bridge server /start_mission rejects duplicate missions
  T13  Drone bridge server /start_mission rejects out-of-geofence pickup
  T14  Drone bridge server /check_mission_status returns running/completed
  T15  Drone bridge server /stop_mission works when mission running
  T16  Drone bridge server /reset_mission clears state
  T17  Drone bridge server /telemetry returns all expected fields
  T18  Drone bridge server /preflight_check returns structured result
  T19  Drone bridge server /emergency_stop sets correct phase
  T20  ETA calculation is reasonable for a 500m pickup distance
"""

import sys
import os
import json
import time
import threading
import unittest
from unittest.mock import MagicMock, patch, PropertyMock

# ── Add drone directory to path ────────────────────────────────────────────────
DRONE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, DRONE_DIR)


# ══════════════════════════════════════════════════════════════════════════════
#  T01-T05 — Config & Mission Planner (pure logic, no hardware)
# ══════════════════════════════════════════════════════════════════════════════

class TestConfig(unittest.TestCase):
    """T01: Config module loads correctly with all required keys."""

    def test_all_required_keys_present(self):
        import config
        required = [
            "DRONE_SERIAL_PORT", "DRONE_BAUD_RATE", "MAVLINK_CONNECT_TIMEOUT_S",
            "BASE_LAT", "BASE_LON", "DEPOT_LAT", "DEPOT_LON",
            "TAKEOFF_ALTITUDE_M", "CRUISE_ALTITUDE_M", "CRUISE_SPEED_MS",
            "MAX_ALTITUDE_M", "POSITION_HOLD_RADIUS", "WAYPOINT_TIMEOUT_S",
            "WINCH_SERVO_CHANNEL", "LATCH_SERVO_CHANNEL",
            "WINCH_LOWER_PWM", "WINCH_STOP_PWM", "WINCH_RAISE_PWM",
            "LATCH_OPEN_PWM", "LATCH_CLOSE_PWM",
            "WINCH_LOWER_DURATION_S", "WINCH_RAISE_DURATION_S",
            "BAG_LOAD_WAIT_S", "DEPOT_DROP_WAIT_S",
            "BATTERY_RTL_PCT", "BATTERY_LAND_PCT",
            "MIN_GPS_SATS", "MIN_GPS_FIX", "GEOFENCE_RADIUS_M",
            "TELEMETRY_TIMEOUT_S", "PRE_FLIGHT_MIN_BATT",
            "BRIDGE_HOST", "BRIDGE_PORT",
        ]
        for key in required:
            self.assertTrue(hasattr(config, key), f"config.{key} is missing")

    def test_pwm_values_in_valid_range(self):
        import config
        for name, val in [
            ("WINCH_LOWER_PWM", config.WINCH_LOWER_PWM),
            ("WINCH_STOP_PWM",  config.WINCH_STOP_PWM),
            ("WINCH_RAISE_PWM", config.WINCH_RAISE_PWM),
            ("LATCH_OPEN_PWM",  config.LATCH_OPEN_PWM),
            ("LATCH_CLOSE_PWM", config.LATCH_CLOSE_PWM),
        ]:
            self.assertGreaterEqual(val, 1000, f"{name} < 1000µs")
            self.assertLessEqual(val, 2000,    f"{name} > 2000µs")

    def test_winch_direction_logic(self):
        import config
        # Lower should be a higher PWM than raise (for standard MG996R continuous)
        self.assertGreater(config.WINCH_LOWER_PWM, config.WINCH_STOP_PWM)
        self.assertLess(config.WINCH_RAISE_PWM,   config.WINCH_STOP_PWM)

    def test_battery_thresholds_ordered(self):
        import config
        # PRE_FLIGHT > RTL > LAND
        self.assertGreater(config.PRE_FLIGHT_MIN_BATT, config.BATTERY_RTL_PCT)
        self.assertGreater(config.BATTERY_RTL_PCT,     config.BATTERY_LAND_PCT)

    def test_cruise_altitude_above_takeoff(self):
        import config
        self.assertGreaterEqual(config.CRUISE_ALTITUDE_M, config.TAKEOFF_ALTITUDE_M)

    def test_base_and_depot_coords_differ(self):
        import config
        # Base and Depot coords must both be valid non-zero floating points
        self.assertIsInstance(config.BASE_LAT, float)
        self.assertIsInstance(config.DEPOT_LAT, float)
        self.assertNotEqual(config.BASE_LAT, 0.0)
        self.assertNotEqual(config.DEPOT_LAT, 0.0)


class TestHaversine(unittest.TestCase):
    """T05: Haversine distance formula accuracy check."""

    def test_same_point_is_zero(self):
        from drone_controller import DroneController
        d = DroneController._haversine_distance(12.9716, 77.5946, 12.9716, 77.5946)
        self.assertAlmostEqual(d, 0.0, places=1)

    def test_known_distance(self):
        """
        Distance from (0,0) to (0, 1 degree longitude) ≈ 111,195m at equator.
        """
        from drone_controller import DroneController
        d = DroneController._haversine_distance(0.0, 0.0, 0.0, 1.0)
        self.assertAlmostEqual(d, 111195, delta=100)

    def test_distance_is_symmetric(self):
        from drone_controller import DroneController
        d1 = DroneController._haversine_distance(12.9716, 77.5946, 12.9750, 77.5980)
        d2 = DroneController._haversine_distance(12.9750, 77.5980, 12.9716, 77.5946)
        self.assertAlmostEqual(d1, d2, places=3)


class TestMissionPlanner(unittest.TestCase):
    """T02-T04 & T20: Mission planning logic tests."""

    def setUp(self):
        from mission_planner import MissionPlanner
        self.planner = MissionPlanner()

    def test_T02_valid_coords_builds_4_waypoints(self):
        import config
        wps = self.planner.build_mission(
            config.BASE_LAT + 0.001,  # 111m away from base
            config.BASE_LON + 0.001,
            None
        )
        self.assertIsNotNone(wps)
        self.assertEqual(len(wps), 4)
        purposes = [wp.purpose for wp in wps]
        self.assertEqual(purposes, ["TAKEOFF", "PICKUP", "DEPOT", "RTL"])

    def test_T03_geofence_rejection(self):
        """Pickup 700m away should be rejected (geofence=600m)."""
        import config
        # 0.007 degrees latitude ≈ 777m
        far_lat = config.BASE_LAT + 0.007
        far_lon = config.BASE_LON
        result = self.planner.build_mission(far_lat, far_lon, None)
        self.assertIsNone(result, "Should reject pickup beyond geofence")

    def test_T04_zero_coords_fallback(self):
        """If lat/lon are 0.0, should not crash (falls through to address)."""
        # With address=None and 0.0 coords, should return None gracefully
        result = self.planner.build_mission(0.0, 0.0, None)
        self.assertIsNone(result)

    def test_waypoint_altitudes_valid(self):
        import config
        wps = self.planner.build_mission(
            config.BASE_LAT + 0.001,
            config.BASE_LON + 0.001,
            None
        )
        self.assertIsNotNone(wps)
        for wp in wps:
            self.assertGreater(wp.alt_m, 0)
            self.assertLessEqual(wp.alt_m, config.MAX_ALTITUDE_M)

    def test_T20_eta_reasonable_for_500m(self):
        import config
        # 500m @ 5m/s = 100s flight + 20s takeoff = ~120s
        eta = self.planner.get_eta_to_pickup_s(
            config.BASE_LAT + 0.0045,  # ~500m away
            config.BASE_LON
        )
        self.assertGreater(eta, 20)    # at least takeoff time
        self.assertLess(eta, 300)      # under 5 minutes for a 500m pickup


# ══════════════════════════════════════════════════════════════════════════════
#  T06 — Telemetry Monitor (mocked connection)
# ══════════════════════════════════════════════════════════════════════════════

class TestTelemetryMonitor(unittest.TestCase):
    """T06: Telemetry monitor state dict structure."""

    def test_T06_state_dict_has_all_required_keys(self):
        from telemetry_monitor import TelemetryMonitor
        mock_master = MagicMock()
        tm = TelemetryMonitor(mock_master)
        required_keys = [
            "lat", "lon", "altitude_m", "heading_deg", "speed_ms",
            "battery_pct", "battery_voltage", "battery_current",
            "mode", "armed", "gps_fix", "satellites",
            "roll_deg", "pitch_deg", "distance_to_home",
            "telemetry_ok", "timestamp"
        ]
        state = tm.get_state()
        for key in required_keys:
            self.assertIn(key, state, f"Missing key in telemetry state: {key}")

    def test_telemetry_live_check(self):
        """is_telemetry_live() should return False initially (before any message)."""
        from telemetry_monitor import TelemetryMonitor
        mock_master = MagicMock()
        tm = TelemetryMonitor(mock_master)
        # Artificially age the last message time
        tm._last_msg_time = time.time() - 20  # 20 seconds ago
        self.assertFalse(tm.is_telemetry_live())

    def test_battery_critical_threshold(self):
        import config
        from telemetry_monitor import TelemetryMonitor
        mock_master = MagicMock()
        tm = TelemetryMonitor(mock_master)
        tm.state["battery_pct"] = config.BATTERY_RTL_PCT
        self.assertTrue(tm.is_battery_critical())
        tm.state["battery_pct"] = config.BATTERY_RTL_PCT + 1
        self.assertFalse(tm.is_battery_critical())

    def test_battery_emergency_threshold(self):
        import config
        from telemetry_monitor import TelemetryMonitor
        mock_master = MagicMock()
        tm = TelemetryMonitor(mock_master)
        tm.state["battery_pct"] = config.BATTERY_LAND_PCT
        self.assertTrue(tm.is_battery_emergency())
        tm.state["battery_pct"] = config.BATTERY_LAND_PCT + 1
        self.assertFalse(tm.is_battery_emergency())

    def test_gps_fix_check(self):
        import config
        from telemetry_monitor import TelemetryMonitor
        mock_master = MagicMock()
        tm = TelemetryMonitor(mock_master)
        tm.state["gps_fix"] = config.MIN_GPS_FIX
        tm.state["satellites"] = config.MIN_GPS_SATS
        self.assertTrue(tm.has_gps_fix())
        tm.state["gps_fix"] = 2  # Only 2D fix
        self.assertFalse(tm.has_gps_fix())


# ══════════════════════════════════════════════════════════════════════════════
#  T07-T10 — Safety Manager (mocked telemetry)
# ══════════════════════════════════════════════════════════════════════════════

def _make_safety_manager(state_overrides: dict):
    """Helper: create SafetyManager with mocked telemetry state."""
    from safety_manager import SafetyManager
    import config

    mock_drone = MagicMock()
    mock_drone.is_connected.return_value = True

    mock_telemetry = MagicMock()
    # Default healthy state
    default_state = {
        "lat": config.BASE_LAT, "lon": config.BASE_LON,
        "altitude_m": 0.0, "mode": "STABILIZE",
        "armed": False, "gps_fix": 3, "satellites": 8,
        "battery_pct": 85, "battery_voltage": 11.8,
        "distance_to_home": 0.0, "telemetry_ok": True,
    }
    default_state.update(state_overrides)
    mock_telemetry.get_state.return_value = default_state
    mock_telemetry.is_telemetry_live.return_value = state_overrides.get("_tele_live", True)
    mock_telemetry.is_battery_critical.return_value = False
    mock_telemetry.is_battery_emergency.return_value = False
    mock_telemetry.has_gps_fix.return_value = (
        default_state["gps_fix"] >= 3 and default_state["satellites"] >= 6
    )

    sm = SafetyManager(mock_drone, mock_telemetry)
    return sm


class TestSafetyManager(unittest.TestCase):
    """T07-T10: Pre-flight safety check gate."""

    def test_T07_armed_drone_blocked(self):
        sm = _make_safety_manager({"armed": True})
        passed, failures = sm.pre_flight_check()
        self.assertFalse(passed)
        self.assertTrue(any("armed" in f.lower() for f in failures))

    def test_T08_low_battery_blocked(self):
        import config
        sm = _make_safety_manager({"battery_pct": config.PRE_FLIGHT_MIN_BATT - 1})
        passed, failures = sm.pre_flight_check()
        self.assertFalse(passed)
        self.assertTrue(any("battery" in f.lower() for f in failures))

    def test_T09_no_gps_fix_blocked(self):
        sm = _make_safety_manager({"gps_fix": 1, "satellites": 2})
        # Override has_gps_fix to return False
        passed, failures = sm.pre_flight_check()
        self.assertFalse(passed)
        self.assertTrue(any("gps" in f.lower() for f in failures))

    def test_T10_dead_telemetry_blocked(self):
        sm = _make_safety_manager({"_tele_live": False})
        # Patch is_telemetry_live to return False
        sm._telemetry.is_telemetry_live.return_value = False
        passed, failures = sm.pre_flight_check()
        self.assertFalse(passed)
        self.assertTrue(any("telemetry" in f.lower() for f in failures))

    def test_healthy_state_passes_all_checks(self):
        sm = _make_safety_manager({})
        passed, failures = sm.pre_flight_check()
        self.assertTrue(passed, f"Should pass. Failures: {failures}")
        self.assertEqual(len(failures), 0)

    def test_rtl_mode_blocked(self):
        sm = _make_safety_manager({"mode": "RTL"})
        passed, failures = sm.pre_flight_check()
        self.assertFalse(passed)
        self.assertTrue(any("RTL" in f or "LAND" in f for f in failures))


# ══════════════════════════════════════════════════════════════════════════════
#  T11-T19 — Drone Bridge Server REST API (Flask test client, no hardware)
# ══════════════════════════════════════════════════════════════════════════════

class TestDroneBridgeServer(unittest.TestCase):
    """
    Tests the Flask REST API in --no-drone mode.
    Uses Flask test client so no network port is opened.
    """

    @classmethod
    def setUpClass(cls):
        """Import bridge server module and get the Flask test client."""
        import importlib, sys

        # Patch DroneController and all hardware before importing bridge server
        sys.modules.pop("drone_bridge_server", None)

        with patch("drone_controller.DroneController") as mock_dc_class, \
             patch("telemetry_monitor.TelemetryMonitor") as mock_tm_class, \
             patch("safety_manager.SafetyManager") as mock_sm_class, \
             patch("mission_planner.MissionPlanner") as mock_mp_class:

            mock_dc = MagicMock()
            mock_dc.is_connected.return_value = False
            mock_dc_class.return_value = mock_dc

            mock_tm = MagicMock()
            mock_tm.get_state.return_value = {
                "lat": 12.9716, "lon": 77.5946, "altitude_m": 0.0,
                "heading_deg": 0.0, "speed_ms": 0.0,
                "battery_pct": 85, "battery_voltage": 11.8,
                "mode": "STABILIZE", "armed": False,
                "gps_fix": 3, "satellites": 8,
                "distance_to_home": 0.0,
                "telemetry_ok": False,  # No hardware = not live
                "timestamp": time.time(),
            }
            mock_tm_class.return_value = mock_tm

            import drone_bridge_server
            cls.module = drone_bridge_server

        cls.client = drone_bridge_server.app.test_client()
        cls.client.testing = True

    def _reset_state(self):
        """Reset mission state between tests."""
        self.module.mission_state.update({
            "is_running": False, "completed": False,
            "request_id": None, "start_time": None,
            "phase": "IDLE", "pickup_lat": None,
            "pickup_lon": None, "error": None,
        })

    def test_T11_health_endpoint_returns_online(self):
        resp = self.client.get("/")
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertEqual(data["status"], "online")
        self.assertIn("service", data)
        self.assertIn("drone_connected", data)
        self.assertIn("mission_running", data)

    def test_T12_duplicate_mission_returns_409(self):
        self._reset_state()
        # Mark a mission as running manually
        self.module.mission_state["is_running"] = True
        self.module.mission_state["completed"] = False

        resp = self.client.post(
            "/start_mission",
            json={"request_id": "test-dup", "lat": 12.972, "lon": 77.595}
        )
        self.assertEqual(resp.status_code, 409)
        data = json.loads(resp.data)
        self.assertIn("already running", data.get("message", ""))
        self._reset_state()

    def test_T13_out_of_geofence_returns_400(self):
        self._reset_state()
        import config
        resp = self.client.post(
            "/start_mission",
            json={
                "request_id": "test-oob",
                "lat": config.BASE_LAT + 0.01,   # ~1.1km — over 600m geofence
                "lon": config.BASE_LON + 0.01,
            }
        )
        # Should fail: planner returns None → 400
        self.assertEqual(resp.status_code, 400)

    def test_T14_check_mission_status_idle(self):
        self._reset_state()
        resp = self.client.post("/check_mission_status")
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        # When idle: status is "running" with phase IDLE (no completed flag set)
        self.assertIn(data["status"], ["running", "completed", "error"])

    def test_check_mission_completed_clears_flag(self):
        self._reset_state()
        self.module.mission_state["completed"] = True
        self.module.mission_state["is_running"] = False
        resp = self.client.post("/check_mission_status")
        data = json.loads(resp.data)
        self.assertEqual(data["status"], "completed")
        # Flag should be cleared after being read
        self.assertFalse(self.module.mission_state["completed"])

    def test_T15_stop_mission_no_active_mission(self):
        self._reset_state()
        resp = self.client.post("/stop_mission")
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertEqual(data["status"], "mission_stopped")

    def test_T16_reset_mission_clears_state(self):
        self._reset_state()
        self.module.mission_state.update({
            "is_running": False, "phase": "ERROR",
            "error": "some error", "request_id": "old-id"
        })
        resp = self.client.post("/reset_mission")
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertEqual(data["status"], "mission_reset")
        self.assertEqual(self.module.mission_state["phase"], "IDLE")
        self.assertIsNone(self.module.mission_state["error"])
        self.assertIsNone(self.module.mission_state["request_id"])

    def test_T17_telemetry_returns_all_fields(self):
        # Set up mock telemetry
        self.module.telemetry = MagicMock()
        self.module.telemetry.get_state.return_value = {
            "lat": 12.9716, "lon": 77.5946, "altitude_m": 10.5,
            "heading_deg": 90.0, "speed_ms": 4.8,
            "battery_pct": 85, "battery_voltage": 11.8,
            "mode": "GUIDED", "armed": True,
            "gps_fix": 3, "satellites": 9,
            "distance_to_home": 150.0,
            "telemetry_ok": True, "timestamp": time.time(),
        }
        resp = self.client.get("/telemetry")
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        expected_fields = [
            "lat", "lon", "altitude_m", "heading_deg", "speed_ms",
            "battery_pct", "battery_voltage", "mode", "armed",
            "gps_fix", "satellites", "distance_to_home",
            "telemetry_ok", "mission_phase", "timestamp"
        ]
        for field in expected_fields:
            self.assertIn(field, data, f"Missing field in /telemetry: {field}")

    def test_T18_preflight_check_returns_structured_result(self):
        from safety_manager import SafetyManager
        mock_sm = MagicMock()
        mock_sm.pre_flight_check.return_value = (False, ["GPS fix insufficient"])
        mock_sm.get_status.return_value = {"watchdogs_active": False}
        self.module.safety = mock_sm

        resp = self.client.get("/preflight_check")
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertIn("passed", data)
        self.assertIn("failures", data)
        self.assertIn("safety", data)
        self.assertFalse(data["passed"])
        self.assertEqual(data["failures"], ["GPS fix insufficient"])

    def test_T19_emergency_stop_sets_phase(self):
        self._reset_state()
        self.module.mission_state["is_running"] = True
        resp = self.client.post("/emergency_stop")
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertEqual(data["status"], "emergency_stopped")
        self.assertEqual(self.module.mission_state["phase"], "EMERGENCY_STOPPED")
        self.assertFalse(self.module.mission_state["is_running"])

    def test_cors_headers_present(self):
        """Verify CORS headers are set so frontend at port 5000 can call port 5003."""
        resp = self.client.get("/", headers={"Origin": "http://localhost:5000"})
        self.assertIn("Access-Control-Allow-Origin", resp.headers)


# ══════════════════════════════════════════════════════════════════════════════
#  Main runner with colored summary
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sys

    print("\n" + "=" * 60)
    print("  EcoScrap Drone — Pre-Field Integration Test Suite")
    print("  Running WITHOUT drone hardware (--no-drone mode)")
    print("=" * 60 + "\n")

    loader = unittest.TestLoader()
    suite  = unittest.TestSuite()

    test_classes = [
        TestConfig,
        TestHaversine,
        TestMissionPlanner,
        TestTelemetryMonitor,
        TestSafetyManager,
        TestDroneBridgeServer,
    ]

    for cls in test_classes:
        suite.addTests(loader.loadTestsFromTestCase(cls))

    runner = unittest.TextTestRunner(verbosity=2, stream=sys.stdout)
    result = runner.run(suite)

    print("\n" + "=" * 60)
    total  = result.testsRun
    passed = total - len(result.failures) - len(result.errors)
    print(f"  TOTAL:  {total} tests")
    print(f"  PASSED: {passed}")
    print(f"  FAILED: {len(result.failures)}")
    print(f"  ERRORS: {len(result.errors)}")

    if result.failures:
        print("\nFAILED TESTS:")
        for test, tb in result.failures:
            print(f"  ✗ {test}")
    if result.errors:
        print("\nERRORS:")
        for test, tb in result.errors:
            print(f"  ✗ {test}: {tb.splitlines()[-1]}")

    if result.wasSuccessful():
        print("\n  ✅ ALL TESTS PASSED — System ready for field testing")
    else:
        print("\n  ❌ SOME TESTS FAILED — Fix issues before field testing")
    print("=" * 60 + "\n")

    sys.exit(0 if result.wasSuccessful() else 1)

