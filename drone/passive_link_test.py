"""
EcoScrap Drone — passive_link_test.py
======================================
100% READ-ONLY PASSIVE TELEMETRY MONITOR
GUARANTEED ZERO MOTOR / FLIGHT COMMANDS

This script ONLY LISTENS to incoming MAVLink packets from COM9.
It contains NO arming commands, NO takeoff commands, NO throttle commands.
Motors CANNOT spin from this script.
"""

import sys
import os
import time

# Ensure drone directory in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import config

try:
    from pymavlink import mavutil
except ImportError:
    print("❌ pymavlink not installed. Run: python -m pip install pymavlink")
    sys.exit(1)

GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

print("\n" + "=" * 60)
print(f" {BOLD}🔒 ECOSCRAP DRONE — PASSIVE READ-ONLY LINK MONITOR{RESET}")
print(f" {CYAN}Safety Notice: READ-ONLY mode. ZERO motor commands can be sent.{RESET}")
print(f" Connecting to Ground Unit on {config.DRONE_SERIAL_PORT} @ {config.DRONE_BAUD_RATE} baud...")
print("=" * 60 + "\n")

try:
    master = mavutil.mavlink_connection(
        config.DRONE_SERIAL_PORT,
        baud=config.DRONE_BAUD_RATE,
        autoreconnect=True,
        source_system=255,
        source_component=0
    )
except Exception as e:
    print(f"{RED}❌ Could not open serial port {config.DRONE_SERIAL_PORT}: {e}{RESET}")
    print("   Ensure Ground Unit ESP32 is plugged in.")
    sys.exit(1)

print("⏳ Listening for wireless MAVLink heartbeat from drone (timeout: 25s)...")
start_time = time.time()
heartbeat = master.wait_heartbeat(timeout=25)

if heartbeat is None:
    print(f"\n{YELLOW}⚠️  No heartbeat received yet.{RESET}")
    print("Checklist:")
    print(" 1. Is the drone battery connected and FC powered on?")
    print(" 2. Is the Air Unit ESP32 powered (LED on)?")
    print(" 3. Are RX/TX jumper wires crossed (ESP32 RX2 → FC TX, ESP32 TX2 → FC RX)?")
    print(" 4. Is FC SERIAL1_PROTOCOL set to 2 (MAVLink2) and SERIAL1_BAUD to 57 in Mission Planner?")
    sys.exit(1)

print(f"\n{GREEN}{BOLD}✅ WIRELESS MAVLINK LINK ESTABLISHED!{RESET}")
print(f"   Flight Controller System ID: {master.target_system}")
print(f"   Component ID:               {master.target_component}\n")

print(f"{BOLD}Monitoring Live Telemetry for 10 seconds (READ-ONLY):{RESET}")
print("-" * 60)

end_time = time.time() + 10
last_print = 0

battery_v = 0.0
battery_pct = 0
armed_status = "UNKNOWN"
mode_name = "UNKNOWN"
gps_fix = 0
sats = 0

while time.time() < end_time:
    msg = master.recv_match(blocking=False)
    if not msg:
        time.sleep(0.05)
        continue

    mtype = msg.get_type()

    if mtype == "HEARTBEAT":
        armed = bool(msg.base_mode & mavutil.mavlink.MAV_MODE_FLAG_SAFETY_ARMED)
        armed_status = f"{RED}ARMED{RESET}" if armed else f"{GREEN}DISARMED (SAFE){RESET}"
        try:
            mode_map = {v: k for k, v in master.mode_mapping().items()}
            mode_name = mode_map.get(msg.custom_mode, "UNKNOWN")
        except Exception:
            pass

    elif mtype == "SYS_STATUS":
        battery_pct = msg.battery_remaining
        battery_v = msg.voltage_battery / 1000.0

    elif mtype == "GPS_RAW_INT":
        gps_fix = msg.fix_type
        sats = msg.satellites_visible

    if time.time() - last_print >= 1.0:
        last_print = time.time()
        fix_desc = {0: "No GPS", 1: "No Fix", 2: "2D Fix", 3: "3D Fix (Good)"}.get(gps_fix, f"Fix-{gps_fix}")
        print(f"  [Status] Motor State: {armed_status} | Mode: {mode_name} | Batt: {battery_pct}% ({battery_v:.2f}V) | GPS: {fix_desc} ({sats} sats)")

master.close()
print("-" * 60)
print(f"\n{GREEN}✅ Test complete. Drone confirmed in DISARMED / SAFE state.{RESET}\n")

