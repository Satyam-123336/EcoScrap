# ============================================================
#  EcoScrap Drone — config.py
#  Single source of truth for ALL drone + mission parameters
#  Edit this file to configure for your environment
# ============================================================

import os
from pathlib import Path
from dotenv import load_dotenv

# Automatically load .env from project root
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)

# ── Serial / Connection ────────────────────────────────────────────────────────
# COM port where Ground Unit ESP32 appears (check Device Manager on Windows)
# Linux: typically /dev/ttyUSB0 or /dev/ttyACM0
DRONE_SERIAL_PORT = os.environ.get("DRONE_PORT", "COM9")   # Ground Unit ESP32 COM port
DRONE_BAUD_RATE   = 115200  # High-speed telemetry baud rate

# Connection timeout for pymavlink
MAVLINK_CONNECT_TIMEOUT_S = 30  # seconds to wait for heartbeat

# ── Fixed GPS Locations ────────────────────────────────────────────────────────
# BASE: Where the drone lives (launch pad). Set these to your actual coordinates.
BASE_LAT = float(os.environ.get("DRONE_BASE_LAT", 12.9716))  # Bangalore or custom field
BASE_LON = float(os.environ.get("DRONE_BASE_LON", 77.5946))

# DEPOT: Recycling collection facility where drone delivers e-waste
DEPOT_LAT = float(os.environ.get("DRONE_DEPOT_LAT", 12.9750))
DEPOT_LON = float(os.environ.get("DRONE_DEPOT_LON", 77.5980))

# ── Flight Parameters ──────────────────────────────────────────────────────────
# ArduCopter GUIDED mode parameters (Tuned for Safe Prototype Testing < 100m)
TAKEOFF_ALTITUDE_M   = float(os.environ.get("DRONE_TAKEOFF_ALT", 5.0))   # meters AGL — safe prototype altitude
CRUISE_ALTITUDE_M    = float(os.environ.get("DRONE_CRUISE_ALT", 6.0))    # cruise altitude during waypoint transit
CRUISE_SPEED_MS      = float(os.environ.get("DRONE_CRUISE_SPEED", 2.5))  # horizontal speed in m/s (~9 km/h)
MAX_ALTITUDE_M       = 15.0   # hard ceiling, do not exceed
POSITION_HOLD_RADIUS = 2.0    # meters — drone is "at target" when within this radius
WAYPOINT_TIMEOUT_S   = 90     # max seconds to wait for drone to reach a waypoint

# ── Collection Mechanism ───────────────────────────────────────────────────────
# Servo channel assignments (ArduCopter: SERVO9+ for aux channels)
# WINCH_SERVO_CHANNEL: connected to MG996R continuous rotation servo (winch)
# LATCH_SERVO_CHANNEL: connected to 9g SG90 servo (bag latch/release at depot)
WINCH_SERVO_CHANNEL = 9    # FC auxiliary servo output channel for winch
LATCH_SERVO_CHANNEL = 10   # FC auxiliary servo output channel for latch

# PWM values (microseconds)
WINCH_LOWER_PWM  = 1900    # MG996R spins forward → lowers string
WINCH_STOP_PWM   = 1500    # Neutral → stops winch (important for MG996R continuous)
WINCH_RAISE_PWM  = 1100    # MG996R spins reverse → raises string
LATCH_OPEN_PWM   = 1900    # 9g servo → opens bag latch (depot drop)
LATCH_CLOSE_PWM  = 1100    # 9g servo → closes/locks latch

# Timing
WINCH_LOWER_DURATION_S = 4.0   # seconds to lower bag fully (tune to string length)
WINCH_RAISE_DURATION_S = 4.5   # seconds to raise bag (slightly more to ensure full raise)
BAG_LOAD_WAIT_S        = int(os.environ.get("DRONE_LOAD_WAIT", 15))    # seconds for user to place items (conserves hover battery)
DEPOT_DROP_WAIT_S      = 5     # seconds to open latch at depot before raising

# ── Safety Thresholds ──────────────────────────────────────────────────────────
BATTERY_RTL_PCT      = 20    # % — auto RTL when battery drops here
BATTERY_LAND_PCT     = 10    # % — auto LAND (emergency) at this level
MIN_GPS_SATS         = 6     # minimum satellites for mission start
MIN_GPS_FIX          = 3     # 3D fix required (3=3D fix, 2=2D)
GEOFENCE_RADIUS_M    = float(os.environ.get("DRONE_GEOFENCE_M", 200.0))   # max distance from base (meters)
TELEMETRY_TIMEOUT_S  = 12    # seconds without telemetry → emergency RTL (12s accounts for ESP-NOW latency)
PRE_FLIGHT_MIN_BATT  = 50    # % — minimum battery to start a mission

# ── Mission Timing ─────────────────────────────────────────────────────────────
STATUS_CHECK_INTERVAL_S = 0.5   # how often to poll drone telemetry
LAND_DETECT_ALT_M       = 0.5  # altitude below this → considered landed
MOTOR_DISARM_TIMEOUT_S  = 30   # max seconds to wait for auto-disarm after land

# ── Bridge Server ──────────────────────────────────────────────────────────────
BRIDGE_HOST = "0.0.0.0"
BRIDGE_PORT = 5003              # Different from sim_server (5002) — both can coexist

# ── Geocoding (address → GPS fallback) ────────────────────────────────────────
GEOCODING_USER_AGENT = "EcoScrapPickup/1.0"  # Required by Nominatim ToS
GEOCODING_TIMEOUT_S  = 10
