"""
EcoScrap Drone — drone_bridge_server.py
===========================================
DROP-IN REPLACEMENT for simulation/sim_server.py

Exposes the EXACT SAME REST API endpoints:
  GET  /                     → health check (now includes live telemetry)
  POST /start_mission        → arms drone, executes full 3-point e-waste pickup
  POST /stop_mission         → commands RTL immediately
  POST /resume_mission       → resumes GUIDED mode if paused
  POST /reset_mission        → disarms and clears mission state
  POST /check_mission_status → returns {status: "running"/"completed"/"error"}

NEW endpoints (extra data for admin dashboard):
  GET  /telemetry            → live GPS, battery, altitude, speed, mode
  GET  /preflight_check      → run pre-flight and return result
  POST /emergency_stop       → IMMEDIATE motor disarm (emergency only)

The backend's simulationService.ts connects here when
DRONE_BRIDGE_URL=http://localhost:5003 is set in .env
"""

import sys
import os
os.environ["MAVLINK20"] = "1"  # Ensure MAVLink 2.0 dialect everywhere
import time
import threading
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

# Ensure stdout and stderr handle UTF-8 cleanly on Windows PowerShell (prevents UnicodeEncodeError)
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Import our drone modules from same directory
sys.path.insert(0, os.path.dirname(__file__))

import config
from drone_controller   import DroneController
from telemetry_monitor  import TelemetryMonitor
from mission_planner    import MissionPlanner
from safety_manager     import SafetyManager

# ── Logging setup ──────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("drone_bridge.log", mode="a", encoding="utf-8")
    ]
)
logger = logging.getLogger("DroneBridge")

# ── Flask app ──────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)   # Allow frontend (port 5000) to call drone bridge (port 5003)

# ── Global singletons ──────────────────────────────────────────────────────────
drone     = DroneController()
telemetry = None           # Initialized after connection
planner   = MissionPlanner()
safety    = None           # Initialized after connection
BENCH_MODE = False         # Safe Desk Bench Mode (simulated flight, real physical servos)

# ── Mission state (mirrors what CoppeliaSim used to track) ────────────────────
mission_state = {
    "is_running":   False,
    "completed":    False,
    "request_id":   None,
    "start_time":   None,
    "phase":        "IDLE",    # IDLE / TAKEOFF / TO_PICKUP / COLLECTING / TO_DEPOT / RETURNING / LANDED
    "pickup_lat":   None,
    "pickup_lon":   None,
    "error":        None,
}

# ── Mission thread ─────────────────────────────────────────────────────────────
_mission_thread: threading.Thread = None


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  MISSION EXECUTOR — runs in background thread                              ║
# ║  This is the heart of the real-drone integration.                          ║
# ║  Follows the exact sequence: Takeoff → Pickup → Depot → RTL                ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

def execute_bench_mission(pickup_lat: float, pickup_lon: float, request_id: str):
    """
    Desk bench simulation mode.
    - Zero motor arming / zero prop spin (100% bench safe).
    - Simulates GPS flight path smoothly so frontend map moves in real time.
    - ACTUATES REAL PHYSICAL SERVOS (winch & latch) via CrossFlight over ESP-NOW.
    - Auto-completes mission in database when done.
    """
    global mission_state, telemetry

    logger.info("=" * 60)
    logger.info(f"🚀 BENCH MISSION START — RequestID: {request_id}")
    logger.info(f"Pickup: {pickup_lat:.6f}, {pickup_lon:.6f}")
    logger.info("SAFETY: Motors remain 100% DISARMED (props will not spin).")
    logger.info("PHYSICAL ACTUATION: Real Winch & Latch servos will actuate on desk.")
    logger.info("=" * 60)

    base_lat = config.BASE_LAT
    base_lon = config.BASE_LON
    depot_lat = config.DEPOT_LAT
    depot_lon = config.DEPOT_LON

    def update_sim_telemetry(lat, lon, alt, phase, heading=0.0):
        mission_state["phase"] = phase
        if telemetry:
            telemetry.state["lat"] = lat
            telemetry.state["lon"] = lon
            telemetry.state["altitude_m"] = alt
            telemetry.state["heading_deg"] = heading
            telemetry.state["speed_ms"] = config.CRUISE_SPEED_MS if alt > 0.5 else 0.0
            telemetry.state["mode"] = "GUIDED" if phase not in ("COLLECTING", "DEPOSITING") else "LOITER"

    def interpolate_path(start_lat, start_lon, end_lat, end_lon, steps=10, step_sleep=0.6, phase="TRANSIT"):
        for i in range(1, steps + 1):
            if not mission_state["is_running"]:
                break
            frac = i / steps
            curr_lat = start_lat + (end_lat - start_lat) * frac
            curr_lon = start_lon + (end_lon - start_lon) * frac
            update_sim_telemetry(curr_lat, curr_lon, config.CRUISE_ALTITUDE_M, phase)
            time.sleep(step_sleep)

    try:
        # Phase 1: Takeoff
        mission_state["phase"] = "TAKEOFF"
        mission_state["servo_action"] = "🚁 TAKEOFF: Climbing to 10m cruise altitude"
        logger.info("🚁 [Bench] Simulating Takeoff to 10m...")
        for a in range(1, int(config.TAKEOFF_ALTITUDE_M) + 1):
            mission_state["servo_action"] = f"🚁 TAKEOFF: Climbing to {a}m altitude"
            update_sim_telemetry(base_lat, base_lon, float(a), "TAKEOFF")
            time.sleep(0.3)

        # Phase 2: Transit to User Pickup
        mission_state["phase"] = "TO_PICKUP"
        mission_state["servo_action"] = "✈️ CRUISING: Flying to User Pickup Location (5.0 m/s)"
        logger.info(f"🚁 [Bench] Flying to User Location ({pickup_lat:.6f}, {pickup_lon:.6f})...")
        interpolate_path(base_lat, base_lon, pickup_lat, pickup_lon, steps=10, phase="TO_PICKUP")

        # Phase 3: Collection (Winch Servo Lower -> Pause 15s -> Winch Servo Raise)
        mission_state["phase"] = "COLLECTING"
        mission_state["servo_action"] = "📍 ARRIVED: Hovering in LOITER above User Location"
        update_sim_telemetry(pickup_lat, pickup_lon, config.CRUISE_ALTITUDE_M, "COLLECTING")
        logger.info("📍 Arrived at user location — hovering in LOITER")
        
        # Physical Servo Lower
        mission_state["servo_action"] = "⬇️ WINCH SERVO: Lowering collection bag to user (4s @ 1900µs PWM)"
        if drone and drone.is_connected():
            logger.info("⬇️ [HARDWARE] Actuating Winch: Lowering bag to user...")
            drone.lower_bag()
        else:
            logger.info("⬇️ [SIM] Lowering bag via winch (4s)...")
            time.sleep(config.WINCH_LOWER_DURATION_S)

        # Loading window pause (15 seconds on bench for testing, or full BAG_LOAD_WAIT_S)
        wait_s = min(15, config.BAG_LOAD_WAIT_S)
        logger.info(f"⏳ Waiting {wait_s}s for user to load e-waste into bag...")
        for remaining in range(wait_s, 0, -1):
            if not mission_state["is_running"]:
                break
            mission_state["servo_action"] = f"⏳ LOADING WINDOW: Place e-waste into bag ({remaining}s remaining)"
            time.sleep(1)

        # Physical Servo Raise
        mission_state["servo_action"] = "⬆️ WINCH SERVO: Hoisting bag up & securing items (4.5s @ 1100µs PWM)"
        if drone and drone.is_connected():
            logger.info("⬆️ [HARDWARE] Actuating Winch: Raising bag with items...")
            drone.raise_bag()
        else:
            logger.info("⬆️ [SIM] Raising bag via winch (4.5s)...")
            time.sleep(config.WINCH_RAISE_DURATION_S)

        mission_state["servo_action"] = "✅ Items secured in collection bag"
        logger.info("✅ Items collected and secured.")

        # Phase 4: Transit to Depot
        mission_state["phase"] = "TO_DEPOT"
        mission_state["servo_action"] = "✈️ CRUISING: Flying to Recycling Depot (5.0 m/s)"
        logger.info(f"🏭 [Bench] Flying to Recycling Depot ({depot_lat:.6f}, {depot_lon:.6f})...")
        interpolate_path(pickup_lat, pickup_lon, depot_lat, depot_lon, steps=10, phase="TO_DEPOT")

        # Phase 5: Deposit at Depot (Latch Servo Actuation)
        mission_state["phase"] = "DEPOSITING"
        mission_state["servo_action"] = "🔓 LATCH SERVO: Opening trapdoor & releasing scrap into depot bin (1900µs)"
        update_sim_telemetry(depot_lat, depot_lon, config.CRUISE_ALTITUDE_M, "DEPOSITING")
        logger.info("📦 Arrived at Depot — depositing items...")
        if drone and drone.is_connected():
            logger.info("🔓 [HARDWARE] Actuating Latch Servo: Releasing scrap into bin...")
            drone.release_bag_at_depot()
        else:
            logger.info("🔓 [SIM] Releasing latch servo at depot...")
            time.sleep(3)

        mission_state["servo_action"] = "✅ Scrap successfully dropped into recycling bin"
        logger.info("✅ E-waste successfully deposited at Depot.")

        # Phase 6: Return to Base (RTL)
        mission_state["phase"] = "RETURNING"
        mission_state["servo_action"] = "🏠 RTL: Returning to Launch Base Pad (5.0 m/s)"
        logger.info(f"🏠 [Bench] Returning to Launch Base ({base_lat:.6f}, {base_lon:.6f})...")
        interpolate_path(depot_lat, depot_lon, base_lat, base_lon, steps=10, phase="RETURNING")

        # Phase 7: Land
        mission_state["phase"] = "LANDED"
        mission_state["servo_action"] = "🛬 LANDING: Descending to touchdown"
        logger.info("🛬 [Bench] Simulating Landing...")
        for a in range(int(config.TAKEOFF_ALTITUDE_M), -1, -1):
            mission_state["servo_action"] = f"🛬 LANDING: Altitude {a}m"
            update_sim_telemetry(base_lat, base_lon, float(a), "LANDED")
            time.sleep(0.3)

        # Complete
        mission_state["is_running"] = False
        mission_state["completed"] = True
        mission_state["phase"] = "COMPLETED"
        mission_state["servo_action"] = "🏆 MISSION COMPLETE: Landed at Base & Disarmed"
        mission_state["error"] = None
        logger.info("=" * 60)
        logger.info(f"✅ BENCH MISSION COMPLETED — Request {request_id} Ready for Auto-Completion!")
        logger.info("=" * 60)

    except Exception as e:
        logger.exception(f"Error in bench mission: {e}")
        mission_state["is_running"] = False
        mission_state["error"] = str(e)
        mission_state["phase"] = "ERROR"


def execute_mission(pickup_lat: float, pickup_lon: float, request_id: str):
    """
    Full autonomous e-waste collection mission.
    Runs in a background thread so /start_mission returns immediately.
    """
    global mission_state, safety

    if BENCH_MODE:
        execute_bench_mission(pickup_lat, pickup_lon, request_id)
        return

    logger.info("=" * 60)
    logger.info(f"MISSION START — RequestID: {request_id}")
    logger.info(f"Pickup: {pickup_lat:.6f}, {pickup_lon:.6f}")
    logger.info(f"Depot:  {config.DEPOT_LAT:.6f}, {config.DEPOT_LON:.6f}")
    logger.info("=" * 60)

    def abort(reason: str, phase: str = "ERROR"):
        mission_state["is_running"] = False
        mission_state["phase"]      = phase
        mission_state["error"]      = reason
        if safety:
            safety.stop_watchdogs()
        logger.error(f"❌ MISSION ABORTED: {reason}")

    try:
        # ── Phase: PRE-FLIGHT ──────────────────────────────────────────────────
        mission_state["phase"] = "PREFLIGHT"
        ok, failures = safety.pre_flight_check()
        if not ok:
            return abort(f"Pre-flight failed: {'; '.join(failures)}")

        # ── Phase: ARM + TAKEOFF ───────────────────────────────────────────────
        mission_state["phase"] = "TAKEOFF"

        if not drone.set_mode("GUIDED"):
            return abort("Could not set GUIDED mode")
        time.sleep(1)

        if not drone.arm():
            return abort("Motor arm failed — check pre-arm conditions")
        time.sleep(2)

        # Start safety watchdogs AFTER arm (they'll RTL if something goes wrong)
        safety.start_watchdogs()

        if not drone.takeoff(config.TAKEOFF_ALTITUDE_M):
            return abort("Takeoff failed or timed out")

        drone.set_speed(config.CRUISE_SPEED_MS)
        logger.info(f"Cruise speed set to {config.CRUISE_SPEED_MS} m/s")
        time.sleep(1)

        # ── Phase: TRANSIT TO PICKUP ───────────────────────────────────────────
        mission_state["phase"] = "TO_PICKUP"
        logger.info(f"🚁 Flying to pickup location...")

        if not drone.goto_location(pickup_lat, pickup_lon, config.CRUISE_ALTITUDE_M):
            return abort("Failed to reach pickup location")

        # ── Phase: COLLECTION ──────────────────────────────────────────────────
        mission_state["phase"] = "COLLECTING"

        # Switch to LOITER for stable hover at pickup
        if not drone.loiter():
            logger.warning("Could not switch to LOITER — continuing in GUIDED")

        logger.info("📍 Arrived at pickup location — hovering")
        logger.info(f"⬇️  Lowering bag for {config.BAG_LOAD_WAIT_S}s user loading window")

        # Lower the bag
        drone.lower_bag()

        # Wait for user to place items
        logger.info(f"⏳ Waiting {config.BAG_LOAD_WAIT_S}s for user to load items...")
        time.sleep(config.BAG_LOAD_WAIT_S)

        # Raise the bag with items
        drone.raise_bag()
        logger.info("✅ Items collected — bag secured")

        # Switch back to GUIDED for next waypoint
        drone.set_mode("GUIDED")
        time.sleep(1)

        # ── Phase: TRANSIT TO DEPOT ────────────────────────────────────────────
        mission_state["phase"] = "TO_DEPOT"
        logger.info(f"🏭 Flying to recycling depot...")

        if not drone.goto_location(config.DEPOT_LAT, config.DEPOT_LON, config.CRUISE_ALTITUDE_M):
            # If we can't reach depot, RTL with items (better than losing drone)
            logger.warning("Could not reach depot — RTL with items")
            drone.return_to_launch()
            drone.wait_for_landing()
            drone.disarm()
            return abort("Could not reach depot", phase="RTL_WITH_ITEMS")

        # ── Phase: DEPOSIT ITEMS ───────────────────────────────────────────────
        logger.info("📦 At depot — depositing items...")
        drone.loiter()   # Hold position while releasing
        drone.release_bag_at_depot()
        logger.info("✅ Items deposited at recycling depot")

        # Switch back to GUIDED for RTL command
        drone.set_mode("GUIDED")
        time.sleep(1)

        # ── Phase: RETURN TO BASE ──────────────────────────────────────────────
        mission_state["phase"] = "RETURNING"
        logger.info("🏠 Returning to base...")

        if not drone.return_to_launch():
            return abort("RTL command failed")

        # Wait for drone to land at base
        landed = drone.wait_for_landing(timeout_s=config.MOTOR_DISARM_TIMEOUT_S + 60)
        if not landed:
            logger.warning("Landing timeout — drone may still be descending")

        # ── Phase: LANDED + CLEANUP ────────────────────────────────────────────
        mission_state["phase"] = "LANDED"

        # Disarm motors
        time.sleep(3)   # Brief pause after touchdown
        drone.disarm()
        safety.stop_watchdogs()

        # ── MISSION COMPLETE ───────────────────────────────────────────────────
        mission_state["is_running"] = False   # ← mission is now done
        mission_state["completed"]  = True    # ← backend polls for this flag
        mission_state["phase"]      = "COMPLETED"
        mission_state["error"]      = None

        logger.info("=" * 60)
        logger.info(f"✅ MISSION COMPLETE — RequestID: {request_id}")
        logger.info("=" * 60)

    except Exception as e:
        logger.exception(f"Unhandled exception in mission executor: {e}")
        abort(f"Unhandled error: {str(e)}")
        try:
            drone.return_to_launch()
        except Exception:
            pass


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  REST API ENDPOINTS — identical surface to sim_server.py                   ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

@app.route("/", methods=["GET"])
def health_check():
    """
    Health check endpoint.
    Now also returns live drone telemetry (superset of sim_server response).
    """
    global telemetry
    tele = telemetry.get_state() if telemetry else {}
    return jsonify({
        "status":            "online",
        "service":           "EcoScrap Drone Bridge Server",
        "drone_connected":   drone.is_connected(),
        "mission_running":   mission_state["is_running"],
        "mission_phase":     mission_state["phase"],
        "battery_pct":       tele.get("battery_pct"),
        "gps_fix":           tele.get("gps_fix"),
        "armed":             tele.get("armed"),
        "timestamp":         time.time()
    })


@app.route("/start_mission", methods=["POST"])
def start_mission():
    """
    Start the autonomous e-waste collection mission.

    Expected JSON body (sent by simulationService.ts):
    {
        "request_id": "<UUID>",
        "lat": <float>,          ← pickup latitude from DB
        "lon": <float>,          ← pickup longitude from DB
        "address": "<string>",   ← fallback if lat/lon null
        "weight": "<string>"     ← informational
    }

    Response: {"status": "mission_started"} or error
    """
    global _mission_thread, mission_state, telemetry, safety

    # Guard: only one mission at a time
    if mission_state["is_running"] and not mission_state["completed"]:
        return jsonify({
            "status":  "error",
            "message": "A mission is already running"
        }), 409

    body = request.get_json(silent=True) or {}

    request_id = body.get("request_id", "unknown")
    pickup_lat = body.get("lat")
    pickup_lon = body.get("lon")
    pickup_addr = body.get("address", "")
    weight     = body.get("weight", "0")

    logger.info(f"START_MISSION received: id={request_id}, "
                f"lat={pickup_lat}, lon={pickup_lon}, addr='{pickup_addr}'")

    # Validate/resolve pickup coordinates
    mission = planner.build_mission(pickup_lat, pickup_lon, pickup_addr)
    if mission is None and BENCH_MODE and pickup_lat is not None and pickup_lon is not None:
        logger.info("Bench mode: auto-anchoring Base and Depot relative to user pickup coordinates")
        config.BASE_LAT = float(pickup_lat) - 0.001
        config.BASE_LON = float(pickup_lon) - 0.001
        config.DEPOT_LAT = float(pickup_lat) + 0.001
        config.DEPOT_LON = float(pickup_lon) + 0.001
        mission = planner.build_mission(pickup_lat, pickup_lon, pickup_addr)

    if mission is None:
        return jsonify({
            "status":  "error",
            "message": "Could not determine pickup GPS location"
        }), 400

    pickup_wp = next((wp for wp in mission if wp.purpose == "PICKUP"), None)
    if not pickup_wp:
        return jsonify({"status": "error", "message": "No pickup waypoint in mission"}), 400

    # Reset mission state
    mission_state.update({
        "is_running":  True,
        "completed":   False,
        "request_id":  request_id,
        "start_time":  time.time(),
        "phase":       "STARTING",
        "pickup_lat":  pickup_wp.lat,
        "pickup_lon":  pickup_wp.lon,
        "error":       None,
    })

    # Launch mission in background thread
    _mission_thread = threading.Thread(
        target=execute_mission,
        args=(pickup_wp.lat, pickup_wp.lon, request_id),
        daemon=True,
        name=f"Mission-{request_id[:8]}"
    )
    _mission_thread.start()

    # Estimate ETA for user notification
    eta_s = planner.get_eta_to_pickup_s(pickup_wp.lat, pickup_wp.lon)

    logger.info(f"Mission thread started. ETA to pickup: {eta_s}s")

    return jsonify({
        "status":        "mission_started",
        "request_id":    request_id,
        "eta_seconds":   eta_s,
        "pickup_coords": {"lat": pickup_wp.lat, "lon": pickup_wp.lon},
        "depot_coords":  {"lat": config.DEPOT_LAT, "lon": config.DEPOT_LON},
    })


@app.route("/check_mission_status", methods=["POST"])
def check_mission_status():
    """
    Polled by simulationService.ts every 500ms.
    Returns {"status": "completed"} when drone lands and mission finishes.
    This is what triggers autoCompletePickupRequest() in the TypeScript backend.
    """
    if mission_state["completed"]:
        # Clear completion flag so it doesn't re-trigger
        mission_state["completed"]  = False
        mission_state["is_running"] = False
        logger.info("Mission completion reported to backend — request will be auto-completed")
        return jsonify({"status": "completed"})

    if mission_state.get("error") and not mission_state["is_running"]:
        return jsonify({"status": "error", "message": mission_state["error"]})

    return jsonify({
        "status": "running",
        "phase":  mission_state["phase"],
    })


@app.route("/stop_mission", methods=["POST"])
def stop_mission():
    """
    Stop the active mission. Commands RTL immediately.
    Drone returns home safely.
    """
    if not mission_state["is_running"]:
        return jsonify({"status": "mission_stopped", "message": "No active mission"})

    logger.info("STOP_MISSION received — commanding RTL")
    try:
        drone.return_to_launch()
        if safety:
            safety.stop_watchdogs()
        mission_state["is_running"] = False
        mission_state["phase"]      = "RTL"
        return jsonify({"status": "mission_stopped"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/resume_mission", methods=["POST"])
def resume_mission():
    """
    Resume from a paused state. Switches FC back to GUIDED mode.
    """
    logger.info("RESUME_MISSION received")
    try:
        drone.set_mode("GUIDED")
        mission_state["phase"] = "RESUMED"
        return jsonify({"status": "mission_resumed"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/reset_mission", methods=["POST"])
def reset_mission():
    """
    Reset all mission state. Disarms if needed.
    Call this between missions to ensure clean state.
    """
    logger.info("RESET_MISSION received")
    try:
        if mission_state["is_running"]:
            drone.return_to_launch()
            time.sleep(2)

        drone.disarm()
        if safety:
            safety.stop_watchdogs()

        mission_state.update({
            "is_running": False,
            "completed":  False,
            "request_id": None,
            "start_time": None,
            "phase":      "IDLE",
            "error":      None,
        })

        return jsonify({"status": "mission_reset"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ── NEW: Extra endpoints for enhanced dashboard telemetry ──────────────────────

@app.route("/telemetry", methods=["GET"])
def get_telemetry():
    """
    Live drone telemetry for admin dashboard.
    Frontend polls this to show real-time drone status.
    """
    global telemetry
    if not telemetry:
        return jsonify({"error": "Telemetry not initialized"}), 503

    state = telemetry.get_state()
    lat = state.get("lat")
    lon = state.get("lon")
    # If drone has no GPS fix (e.g. indoors), anchor display location to Base pad coordinates
    if not lat or lat == 0.0 or not lon or lon == 0.0:
        lat = config.BASE_LAT
        lon = config.BASE_LON

    return jsonify({
        "lat":              lat,
        "lon":              lon,
        "altitude_m":       state.get("altitude_m"),
        "heading_deg":      state.get("heading_deg"),
        "roll_deg":         state.get("roll_deg", 0.0),
        "pitch_deg":        state.get("pitch_deg", 0.0),
        "speed_ms":         state.get("speed_ms"),
        "battery_pct":      state.get("battery_pct"),
        "battery_voltage":  state.get("battery_voltage"),
        "mode":             state.get("mode"),
        "armed":            state.get("armed"),
        "gps_fix":          state.get("gps_fix"),
        "satellites":       state.get("satellites"),
        "distance_to_home": state.get("distance_to_home"),
        "telemetry_ok":     state.get("telemetry_ok"),
        "mission_phase":    mission_state["phase"],
        "servo_action":     mission_state.get("servo_action", "Ready on Launch Pad"),
        "base_coords":      {"lat": config.BASE_LAT, "lon": config.BASE_LON},
        "depot_coords":     {"lat": config.DEPOT_LAT, "lon": config.DEPOT_LON},
        "pickup_coords":    {"lat": mission_state.get("pickup_lat"), "lon": mission_state.get("pickup_lon")},
        "fc_status_text":   state.get("last_statustext", ""),
        "timestamp":        state.get("timestamp"),
    })


@app.route("/map", methods=["GET"])
@app.route("/tracker", methods=["GET"])
def live_map():
    """Serves the live interactive visual flight radar map."""
    html_file = os.path.join(os.path.dirname(__file__), "map_view.html")
    if os.path.exists(html_file):
        with open(html_file, "r", encoding="utf-8") as f:
            return f.read()
    return "Map visualizer template not found", 404


@app.route("/preflight_check", methods=["GET"])
def run_preflight():
    """Run pre-flight safety checks and return results (for admin UI)."""
    if not safety:
        return jsonify({"error": "Safety manager not initialized"}), 503

    passed, failures = safety.pre_flight_check()
    return jsonify({
        "passed":   passed,
        "failures": failures,
        "safety":   safety.get_status()
    })


@app.route("/emergency_stop", methods=["POST"])
def emergency_stop():
    """
    Immediate motor disarm — USE ONLY IN ABSOLUTE EMERGENCY.
    Drone will fall. Only use when on ground or to prevent catastrophic crash.
    """
    logger.critical("⚠️ EMERGENCY STOP REQUESTED")
    drone.emergency_stop()
    if safety:
        safety.stop_watchdogs()
    mission_state["is_running"] = False
    mission_state["phase"]      = "EMERGENCY_STOPPED"
    return jsonify({"status": "emergency_stopped"})


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  SERVER STARTUP                                                             ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

def initialize_drone():
    """
    Connect to drone via ESP32 Ground Unit COM port.
    Called once at server start.
    Returns True if connection successful.
    """
    global telemetry, safety

    logger.info("=" * 60)
    logger.info("EcoScrap Drone Bridge Server — Initializing")
    logger.info(f"Connecting to: {config.DRONE_SERIAL_PORT} @ {config.DRONE_BAUD_RATE}")
    logger.info("=" * 60)

    if not drone.connect():
        logger.error("❌ Could not connect to drone — check ESP32 ground unit and wiring")
        return False

    # Start telemetry reader
    telemetry = TelemetryMonitor(drone.master)
    telemetry.start()
    drone.telemetry = telemetry  # Share thread-safe telemetry with controller

    # Give telemetry a moment to populate state
    logger.info("Waiting for initial telemetry data...")
    time.sleep(3)

    # Initialize safety manager
    safety = SafetyManager(drone, telemetry)

    state = telemetry.get_state()
    logger.info(f"Initial state: GPS fix={state['gps_fix']}, "
                f"Sats={state['satellites']}, "
                f"Battery={state['battery_pct']}%, "
                f"Armed={state['armed']}")
    logger.info("✅ Drone bridge initialized and ready")
    return True


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="EcoScrap Drone Bridge Server")
    parser.add_argument("--no-drone", action="store_true",
                        help="Start server without connecting to drone (for testing)")
    parser.add_argument("--bench", action="store_true",
                        help="Start in Desk Bench Mode: simulates flight (ZERO motor spin), but ACTUATES real physical servos on desk")
    args = parser.parse_args()

    BENCH_MODE = args.bench

    if BENCH_MODE:
        logger.info("=" * 60)
        logger.info("🔧 DESK BENCH MODE ACTIVE")
        logger.info("   • Motors: 100% DISARMED (props will NEVER spin)")
        logger.info("   • Servos: LIVE (Winch & Latch physically actuate on desk)")
        logger.info("   • Coordinates: Auto-anchored to user pickup location")
        logger.info("=" * 60)

    if not args.no_drone:
        success = initialize_drone()
        if not success:
            logger.warning("⚠️  Could not connect to drone hardware on COM port.")
            if BENCH_MODE:
                logger.info("Initializing fallback simulated telemetry for bench mode...")
                telemetry = TelemetryMonitor(None)
                telemetry.state.update({
                    "lat": config.BASE_LAT,
                    "lon": config.BASE_LON,
                    "altitude_m": 0.0,
                    "battery_pct": 100,
                    "battery_voltage": 12.6,
                    "telemetry_ok": True,
                    "gps_fix": 3,
                    "satellites": 10,
                    "mode": "BENCH_READY"
                })
                safety = SafetyManager(drone, telemetry)
    else:
        logger.info("--no-drone flag: Skipping hardware connection")
        telemetry = TelemetryMonitor(None)
        telemetry.state.update({
            "lat": config.BASE_LAT,
            "lon": config.BASE_LON,
            "altitude_m": 0.0,
            "battery_pct": 100,
            "battery_voltage": 12.6,
            "telemetry_ok": True,
            "gps_fix": 3,
            "satellites": 10,
            "mode": "BENCH_READY" if BENCH_MODE else "STANDBY"
        })
        safety = SafetyManager(drone, telemetry)

    logger.info("=" * 60)
    logger.info(f"Drone Bridge running on http://localhost:{config.BRIDGE_PORT}")
    logger.info("Endpoints match sim_server.py — backend requires no changes!")
    logger.info("Set DRONE_BRIDGE_URL=http://localhost:5003 in .env")
    logger.info("=" * 60)

    app.run(
        host=config.BRIDGE_HOST,
        port=config.BRIDGE_PORT,
        debug=False,
        use_reloader=False   # Important: prevent Flask from restarting the drone connection
    )
