import time
import math
import sys
from pymavlink import mavutil

print("\n" + "=" * 65)
print(" 🚁 LIVE DRONE GYROSCOPE STREAM (15 SECONDS)")
print(" TILT OR ROTATE YOUR DRONE NOW!")
print("=" * 65)
print("{:<10} | {:<10} | {:<10} | {:<10} | {:<18}".format("TIME", "ROLL", "PITCH", "YAW", "ORIENTATION"))
print("-" * 65)

master = mavutil.mavlink_connection('COM9', baud=115200)
hb = master.wait_heartbeat(timeout=8)

if not hb:
    print("❌ No heartbeat received from drone.")
    sys.exit(1)

# Request extra1 streams (attitude)
master.mav.request_data_stream_send(
    master.target_system, master.target_component,
    mavutil.mavlink.MAV_DATA_STREAM_ALL,
    10, 1
)

t_end = time.time() + 15
last_p = 0
r, p, y = 0.0, 0.0, 0.0

while time.time() < t_end:
    msg = master.recv_match(type='ATTITUDE', blocking=False)
    if msg:
        r = math.degrees(msg.roll)
        p = math.degrees(msg.pitch)
        y = math.degrees(msg.yaw)

        if time.time() - last_p > 0.4:
            last_p = time.time()
            t_str = time.strftime('%H:%M:%S')

            if r > 8.0:
                tilt = "➡️ TILTED RIGHT"
            elif r < -8.0:
                tilt = "⬅️ TILTED LEFT"
            elif p > 8.0:
                tilt = "⬇️ NOSE DOWN"
            elif p < -8.0:
                tilt = "⬆️ NOSE UP"
            else:
                tilt = "🟢 LEVEL"

            print(f"{t_str:<10} | {r:+6.1f}°    | {p:+6.1f}°    | {y:+6.1f}°    | {tilt}")

    time.sleep(0.01)

master.close()
print("-" * 65)
print("✅ Live monitor complete!")

