"""
EcoScrap Drone — verify_integration.py
=======================================
One-command integration verification script.
Run this BEFORE every field test session.

Usage:
  python drone/verify_integration.py          # Full check (requires ESP32 + FC)
  python drone/verify_integration.py --dry    # Software-only checks (no hardware)

Output: Green ✅ for each check, Red ❌ with explanation for failures.
Exit code 0 = all critical checks passed, safe to fly.
Exit code 1 = critical failure, do NOT fly.
"""

import sys
import os
import time
import argparse

# Add drone directory to path
DRONE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, DRONE_DIR)

GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
RESET  = "\033[0m"
BOLD   = "\033[1m"

def ok(msg):   print(f"  {GREEN}✅{RESET} {msg}")
def fail(msg): print(f"  {RED}❌{RESET} {msg}")
def warn(msg): print(f"  {YELLOW}⚠️ {RESET} {msg}")
def header(msg): print(f"\n{BOLD}── {msg} {'─'*(55-len(msg))}{RESET}")


def check_config():
    header("1. Config Validation")
    import config
    errors = []

    if config.DRONE_SERIAL_PORT == "COM4":
        warn("DRONE_SERIAL_PORT is still default COM4 — verify correct port in config.py")

    base_placeholder = abs(config.BASE_LAT - 12.9716) < 0.001 and abs(config.BASE_LON - 77.5946) < 0.001
    depot_placeholder = abs(config.DEPOT_LAT - 12.975) < 0.001 and abs(config.DEPOT_LON - 77.598) < 0.001

    if base_placeholder:
        warn("BASE coordinates are still placeholder values — set your actual launch pad GPS in config.py")
    else:
        ok(f"Base coords: {config.BASE_LAT:.6f}, {config.BASE_LON:.6f}")

    if depot_placeholder:
        warn("DEPOT coordinates are still placeholder values — set your actual depot GPS in config.py")
    else:
        ok(f"Depot coords: {config.DEPOT_LAT:.6f}, {config.DEPOT_LON:.6f}")

    ok(f"PWM range: LOWER={config.WINCH_LOWER_PWM}µs, STOP={config.WINCH_STOP_PWM}µs, RAISE={config.WINCH_RAISE_PWM}µs")
    ok(f"Safety: bat_rtl={config.BATTERY_RTL_PCT}%, bat_land={config.BATTERY_LAND_PCT}%, geofence={config.GEOFENCE_RADIUS_M}m")
    ok(f"Timing: bag_wait={config.BAG_LOAD_WAIT_S}s, takeoff={config.TAKEOFF_ALTITUDE_M}m, cruise={config.CRUISE_ALTITUDE_M}m")
    return True


def check_dependencies():
    header("2. Python Dependencies")
    deps = {
        "flask":    "Flask web server",
        "flask_cors": "CORS headers",
        "pymavlink": "MAVLink protocol",
        "geopy":    "GPS geocoding",
        "serial":   "PySerial (COM port)",
    }
    all_ok = True
    for mod, desc in deps.items():
        try:
            __import__(mod)
            ok(f"{mod} ({desc})")
        except ImportError:
            fail(f"{mod} NOT INSTALLED — run: python -m pip install {mod}")
            all_ok = False
    return all_ok


def check_mission_planner():
    header("3. Mission Planner Logic")
    from mission_planner import MissionPlanner
    import config

    p = MissionPlanner()

    # Test 1: Valid mission
    wps = p.build_mission(config.BASE_LAT + 0.001, config.BASE_LON + 0.001, None)
    if wps and len(wps) == 4:
        ok(f"Mission planning: 4 waypoints generated correctly")
    else:
        fail("Mission planning returned unexpected result")
        return False

    # Test 2: Geofence
    far_wps = p.build_mission(config.BASE_LAT + 0.01, config.BASE_LON + 0.01, None)
    if far_wps is None:
        ok("Geofence rejection: out-of-range pickup correctly blocked")
    else:
        fail("Geofence NOT working — out-of-range pickup was accepted!")
        return False

    # Test 3: ETA estimate
    eta = p.get_eta_to_pickup_s(config.BASE_LAT + 0.002, config.BASE_LON + 0.002)
    ok(f"ETA estimate: {eta}s for a ~300m pickup")

    return True


def check_bridge_server_imports():
    header("4. Bridge Server Import Check")
    try:
        # Import without starting server
        from drone_bridge_server import app
        ok("drone_bridge_server.py imports cleanly")
        ok(f"Flask app created: {app.name}")
        return True
    except Exception as e:
        fail(f"Bridge server import failed: {e}")
        return False


def check_hardware_connection(dry_run: bool):
    header("5. Hardware Connection (ESP32 + Flight Controller)")
    import config

    if dry_run:
        warn("DRY RUN: Skipping hardware connection test")
        warn(f"  When ready, connect Ground ESP32 to {config.DRONE_SERIAL_PORT}")
        warn(f"  Power on drone, verify FC boots, GPS locks")
        return True  # Not a critical failure in dry-run

    from drone_controller import DroneController
    drone = DroneController()

    print(f"  Connecting to {config.DRONE_SERIAL_PORT} @ {config.DRONE_BAUD_RATE} baud...")
    if drone.connect():
        ok(f"MAVLink connection established!")

        # Check telemetry
        from telemetry_monitor import TelemetryMonitor
        tm = TelemetryMonitor(drone.master)
        tm.start()
        time.sleep(3)
        state = tm.get_state()

        ok(f"Mode:      {state['mode']}")
        ok(f"Armed:     {state['armed']}")
        ok(f"GPS fix:   {state['gps_fix']} ({state['satellites']} sats)")
        ok(f"Battery:   {state['battery_pct']}% @ {state['battery_voltage']:.2f}V")
        ok(f"Telemetry: {'LIVE' if state['telemetry_ok'] else 'NO DATA YET'}")

        tm.stop()
        drone.disconnect()
        return True
    else:
        fail(f"Could not connect to drone on {config.DRONE_SERIAL_PORT}")
        fail("  → Check ESP32 ground unit is plugged into PC via USB-C")
        fail("  → Check ESP32 MAC addresses are configured correctly")
        fail("  → Check Flight Controller is powered on")
        fail("  → Check SERIAL1_PROTOCOL=2 and SERIAL1_BAUD=57 in ArduCopter params")
        return False


def check_preflight_conditions(dry_run: bool):
    header("6. Pre-Flight Safety Gate")
    import config

    if dry_run:
        warn("DRY RUN: Simulating healthy pre-flight state")

        # Simulate the safety check logic
        checks = {
            "Telemetry link": True,
            f"GPS fix ≥ {config.MIN_GPS_FIX} with ≥{config.MIN_GPS_SATS} sats": True,
            f"Battery ≥ {config.PRE_FLIGHT_MIN_BATT}%": True,
            "Motors disarmed": True,
            "FC connected": False,  # No hardware
        }
        for check, passed in checks.items():
            if passed:
                ok(check)
            else:
                warn(f"{check} (expected failure — no hardware)")
        warn("Run WITHOUT --dry flag to test real pre-flight checks")
        return True

    from drone_controller import DroneController
    from telemetry_monitor import TelemetryMonitor
    from safety_manager import SafetyManager

    drone = DroneController()
    if not drone.connect():
        fail("Cannot run pre-flight check — no drone connection")
        return False

    tm = TelemetryMonitor(drone.master)
    tm.start()
    time.sleep(5)  # Let telemetry populate

    sm = SafetyManager(drone, tm)
    passed, failures = sm.pre_flight_check()

    if passed:
        ok("ALL PRE-FLIGHT CHECKS PASSED ✈️")
    else:
        for f in failures:
            fail(f)

    tm.stop()
    drone.disconnect()
    return passed


def check_flask_server_offline():
    header("7. Bridge Server Dry-Run (no hardware)")
    try:
        from drone_bridge_server import app
        client = app.test_client()

        # Health check
        resp = client.get("/")
        assert resp.status_code == 200
        ok("GET  /  → 200 OK")

        # Telemetry (no hardware → 503 expected unless telemetry is mocked)
        resp = client.get("/telemetry")
        assert resp.status_code in (200, 503)
        ok(f"GET  /telemetry  → {resp.status_code}")

        # Pre-flight (no hardware → 503 expected)
        resp = client.get("/preflight_check")
        assert resp.status_code in (200, 503)
        ok(f"GET  /preflight_check  → {resp.status_code}")

        # Stop mission (nothing running → 200)
        resp = client.post("/stop_mission")
        assert resp.status_code == 200
        ok("POST /stop_mission  → 200 OK")

        # Reset
        resp = client.post("/reset_mission")
        assert resp.status_code == 200
        ok("POST /reset_mission  → 200 OK")

        return True
    except Exception as e:
        fail(f"Bridge server offline test failed: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="EcoScrap Drone Integration Verification")
    parser.add_argument("--dry", action="store_true",
                        help="Software-only checks, skip hardware connection")
    args = parser.parse_args()

    print("\n" + "=" * 60)
    print(f"  EcoScrap Drone — Integration Verification")
    if args.dry:
        print(f"  Mode: DRY RUN (no hardware required)")
    else:
        print(f"  Mode: FULL CHECK (hardware required)")
    print("=" * 60)

    critical_pass = True
    results = {}

    results["config"]       = check_config()
    results["deps"]         = check_dependencies()
    results["planner"]      = check_mission_planner()
    results["bridge_import"]= check_bridge_server_imports()
    results["hardware"]     = check_hardware_connection(args.dry)
    results["preflight"]    = check_preflight_conditions(args.dry)
    results["flask_offline"]= check_flask_server_offline()

    # Determine critical failures
    critical_checks = ["config", "deps", "planner", "bridge_import", "flask_offline"]
    if not args.dry:
        critical_checks += ["hardware", "preflight"]

    for check in critical_checks:
        if not results.get(check, False):
            critical_pass = False

    print("\n" + "=" * 60)
    print("  SUMMARY")
    print("=" * 60)
    for name, passed in results.items():
        status = f"{GREEN}PASS{RESET}" if passed else f"{RED}FAIL{RESET}"
        print(f"  {name:<20} {status}")

    print()
    if critical_pass:
        print(f"  {GREEN}{BOLD}✅ SYSTEM READY — All critical checks passed{RESET}")
        if args.dry:
            print(f"  {YELLOW}  Run WITHOUT --dry flag for full hardware check before flight{RESET}")
    else:
        print(f"  {RED}{BOLD}❌ SYSTEM NOT READY — Fix failures above before flying{RESET}")

    print("=" * 60 + "\n")
    return 0 if critical_pass else 1


if __name__ == "__main__":
    sys.exit(main())

