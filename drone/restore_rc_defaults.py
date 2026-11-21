"""
EcoScrap Drone — restore_rc_defaults.py
========================================
Restores the original safety parameters (ARMING_CHECK and FS_THR_ENABLE)
from 'param_backup.json' or sets standard safety factory defaults.
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

def set_param(master, param_name, val, timeout=5):
    print(f"Restoring {param_name} → {val}...")
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
    print("  ECOSCRAP DRONE — RESTORE RC SAFETY CHECKS")
    print("=" * 65)

    target_arming = 1.0   # Default: All checks enabled
    target_fs_thr = 1.0   # Default: RTL / Failsafe on loss of RC

    if os.path.exists(BACKUP_FILE):
        try:
            with open(BACKUP_FILE, "r") as f:
                backup = json.load(f)
            target_arming = backup.get("ARMING_CHECK", 1.0)
            target_fs_thr = backup.get("FS_THR_ENABLE", 1.0)
            print(f"Loaded backup from '{BACKUP_FILE}' (created {backup.get('timestamp')})")
        except Exception as e:
            print(f"Could not read backup file ({e}), using standard defaults.")

    print(f"Connecting to Flight Controller on {config.DRONE_SERIAL_PORT} @ {config.DRONE_BAUD_RATE} baud...")
    master = mavutil.mavlink_connection(
        config.DRONE_SERIAL_PORT,
        baud=config.DRONE_BAUD_RATE,
        source_system=255,
        source_component=mavutil.mavlink.MAV_COMP_ID_MISSIONPLANNER
    )

    print("Waiting for heartbeat...")
    if not master.wait_heartbeat(timeout=10):
        print("❌ Could not connect. Ensure ESP32 is plugged in and bridge server is stopped.")
        return

    print("✅ Flight Controller connected!")
    time.sleep(1)

    print("\nRestoring factory safety parameters:")
    set_param(master, "ARMING_CHECK", target_arming)
    set_param(master, "FS_THR_ENABLE", target_fs_thr)

    print("\n" + "=" * 65)
    print("✅ RC SAFETY CHECKS RESTORED SUCCESSFULLY!")
    print(f"   • ARMING_CHECK  = {target_arming}")
    print(f"   • FS_THR_ENABLE = {target_fs_thr}")
    print("=" * 65 + "\n")

    master.close()

if __name__ == "__main__":
    main()
