"""
EcoScrap Drone — test_servo_aux.py
===================================
Bench testing utility for AUX1 (Winch) and AUX2 (Latch) servos.
Connects via Ground Unit ESP32 (COM9 @ 115200 baud).

SAFETY:
- This script ONLY commands servos (MAV_CMD_DO_SET_SERVO).
- It NEVER arms motors or spins propellers.

Usage:
  python test_servo_aux.py
"""

import sys
import os
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import config
from drone_controller import DroneController

def main():
    print("=" * 60)
    print("  ECOSCRAP DRONE — AUX SERVO HARDWARE BENCH TEST")
    print("  Zero Motors Armed | Actuating Winch & Latch Servos")
    print("=" * 60)

    drone = DroneController()
    print(f"Connecting to FC via Ground Unit on {config.DRONE_SERIAL_PORT} @ {config.DRONE_BAUD_RATE} baud...")

    if not drone.connect():
        print("❌ Could not connect to Flight Controller. Ensure ESP32 is plugged in and drone powered.")
        return

    print("✅ Connected to Flight Controller via wireless ESP-NOW link!")
    time.sleep(1)

    while True:
        print("\n--- SERVO TEST MENU ---")
        print("1. Test Winch LOWER (AUX1 / Ch9 → 1900µs for 4s, then STOP 1500µs)")
        print("2. Test Winch RAISE (AUX1 / Ch9 → 1100µs for 4.5s, then STOP 1500µs)")
        print("3. Test Winch STOP (AUX1 / Ch9 → 1500µs)")
        print("4. Test Latch OPEN (AUX2 / Ch10 → 1900µs)")
        print("5. Test Latch CLOSE (AUX2 / Ch10 → 1100µs)")
        print("6. Run Full Autonomous Collection Simulation (Lower → Wait 10s → Raise → Open Latch → Close)")
        print("0. Exit")

        choice = input("Select an option (0-6): ").strip()

        if choice == "1":
            print("⬇️ Lowering bag (running winch forward)...")
            drone.lower_bag()
            print("✅ Done.")
        elif choice == "2":
            print("⬆️ Raising bag (running winch reverse)...")
            drone.raise_bag()
            print("✅ Done.")
        elif choice == "3":
            print("⏹️ Stopping winch (1500µs)...")
            drone.set_servo(config.WINCH_SERVO_CHANNEL, config.WINCH_STOP_PWM)
            print("✅ Neutral sent.")
        elif choice == "4":
            print("🔓 Opening latch servo (1900µs)...")
            drone.set_servo(config.LATCH_SERVO_CHANNEL, config.LATCH_OPEN_PWM)
            print("✅ Opened.")
        elif choice == "5":
            print("🔒 Closing latch servo (1100µs)...")
            drone.set_servo(config.LATCH_SERVO_CHANNEL, config.LATCH_CLOSE_PWM)
            print("✅ Closed.")
        elif choice == "6":
            print("\n🔄 Running Full Collection Cycle:")
            print("  Step 1: Lowering bag (4s)...")
            drone.lower_bag()
            print("  Step 2: User loading pause (waiting 10s)...")
            for remaining in range(10, 0, -1):
                print(f"    Waiting for user to place item in bag: {remaining}s...", end="\r")
                time.sleep(1)
            print("\n  Step 3: Hoisting bag up (4.5s)...")
            drone.raise_bag()
            print("  Step 4: Simulating arrival at Depot...")
            time.sleep(2)
            print("  Step 5: Opening latch to drop scrap...")
            drone.release_bag_at_depot()
            print("✅ Cycle Complete! Mechanism verified.")
        elif choice == "0":
            break
        else:
            print("Invalid option. Try again.")

    drone.disconnect()
    print("Disconnected safely.")

if __name__ == "__main__":
    main()

