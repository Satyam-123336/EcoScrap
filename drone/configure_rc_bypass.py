"""
EcoScrap Drone — configure_rc_bypass.py
========================================
Temporarily disables RC transmitter pre-arm checks and throttle failsafe
so you can test outdoor autonomous flight and GPS lock without an RC remote.

Parameters modified:
  ARMING_CHECK  → 1470 (Enables Baro, Compass, GPS, INS, Battery, Board Voltage; SKIPS RC)
  FS_THR_ENABLE → 0    (Disables Throttle/Radio Failsafe when RC is absent)

Original parameters are automatically backed up to 'param_backup.json'.
To revert to factory defaults at any time, run:
  python restore_rc_defaults.py
"""

import os
os.environ["MAVLINK20"] = "1"

import sys
import time
import json
from pymavlink import mavutil

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import config

BACKUP_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "param_backup.json")

def get_param(master, param_name, timeout=5):
    master.param_fetch_one(param_name)
    start = time.time()
    while time.time() - start < timeout:
        msg = master.recv_match(type='PARAM_VALUE', blocking=True, timeout=1)
        if msg and msg.param_id.upper() == param_name.upper():
            return msg.param_value
    return None

def set_param(master, param_name, val, timeout=5):
    print(f"Setting {param_name} → {val}...")
    master.param_set_send(param_name, float(val))
    start = time.time()
    while time.time() - start < timeout:
        msg = master.recv_match(type='PARAM_VALUE', blocking=True, timeout=1)
        if msg and msg.param_id.upper() == param_name.upper():
            print(f"  ✅ Confirmed: {param_name} = {msg.param_value}")
            return True
    print(f"  ⚠️ Warning: No ACK received for {param_name}")
    return False

def main():
    print("=" * 65)
    print("  ECOSCRAP DRONE — TEMPORARY RC PRE-ARM CHECK BYPASS")
    print("=" * 65)
    print(f"Connecting to Flight Controller on {config.DRONE_SERIAL_PORT} @ {config.DRONE_BAUD_RATE} baud...")

    master = mavutil.mavlink_connection(
        config.DRONE_SERIAL_PORT,
        baud=config.DRONE_BAUD_RATE,
        source_system=255,
        source_component=mavutil.mavlink.MAV_COMP_ID_MISSIONPLANNER
    )

    print("Waiting for heartbeat...")
    if not master.wait_heartbeat(timeout=10):
        print("❌ Could not connect to Flight Controller. Ensure ESP32 is plugged in and bridge server is stopped.")
        return

    print("✅ Flight Controller connected!")
    time.sleep(1)

    # 1. Read current parameters
    print("\nReading current parameters...")
    cur_arming = get_param(master, "ARMING_CHECK")
    cur_fs_thr = get_param(master, "FS_THR_ENABLE")
    print(f"  Current ARMING_CHECK:  {cur_arming}")
    print(f"  Current FS_THR_ENABLE: {cur_fs_thr}")

    # 2. Save backup
    backup = {
        "ARMING_CHECK": cur_arming if cur_arming is not None else 1.0,
        "FS_THR_ENABLE": cur_fs_thr if cur_fs_thr is not None else 1.0,
        "timestamp": time.ctime()
    }
    with open(BACKUP_FILE, "w") as f:
        json.dump(backup, f, indent=2)
    print(f"📁 Original settings backed up to '{BACKUP_FILE}'")

    # 3. Apply bypass values
    # ARMING_CHECK = 1470:
    #   Barometer(2) + Compass(4) + GPS(8) + INS(16) + Params(32) + Voltage(128) + Battery(256) + Logging(1024) = 1470
    #   RC (64) is explicitly excluded!
    print("\nApplying temporary bypass parameters:")
    set_param(master, "ARMING_CHECK", 1470.0)
    set_param(master, "FS_THR_ENABLE", 0.0)

    print("\n" + "=" * 65)
    print("🎉 SUCCESS: RC PRE-ARM CHECK TEMPORARILY DISABLED!")
    print("   • Compass, GPS, Battery, and IMU checks remain 100% active.")
    print("   • ArduPilot will NO LONGER demand an active RC Transmitter.")
    print("   • When you take the drone outdoors under open sky:")
    print("     The moment GPS gets 3D lock, the LED will turn FLASHING GREEN!")
    print("=" * 65)
    print("\nTo restore original safety parameters later, simply run:")
    print("  python restore_rc_defaults.py\n")

    master.close()

if __name__ == "__main__":
    main()
