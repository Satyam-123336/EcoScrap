import time
import serial
import math
from pymavlink.dialects.v20 import common as mavlink2

print("\n" + "=" * 70)
print(" 🚁 LIVE DRONE ATTITUDE & ORIENTATION MONITOR (DIRECT MAVLINK)")
print(" TILT AND ROTATE YOUR DRONE ON THE DESK TO SEE VALUES CHANGE LIVE!")
print("=" * 70)
print(f"{'TIME':<8} | {'ROLL':<10} | {'PITCH':<10} | {'YAW':<10} | {'HEADING':<10} | {'STATUS'}")
print("-" * 70)

s = serial.Serial()
s.port = 'COM9'
s.baudrate = 115200
s.dtr = False
s.rts = False
s.timeout = 1
s.open()

time.sleep(0.5)
if s.in_waiting > 0:
    s.read(s.in_waiting)

mav = mavlink2.MAVLink(s, srcSystem=255, srcComponent=0)

# Request high-speed attitude streams
for _ in range(3):
    mav.heartbeat_send(mavlink2.MAV_TYPE_GCS, mavlink2.MAV_AUTOPILOT_INVALID, 0, 0, 0)
    mav.request_data_stream_send(1, 1, mavlink2.MAV_DATA_STREAM_EXTRA1, 10, 1)  # 10Hz attitude
    mav.request_data_stream_send(1, 1, mavlink2.MAV_DATA_STREAM_POSITION, 5, 1) # 5Hz heading
    time.sleep(0.08)

t_end = time.time() + 15
last_print = 0
roll = 0.0
pitch = 0.0
yaw = 0.0
heading = 0.0

while time.time() < t_end:
    n = s.in_waiting
    if n > 0:
        msgs = mav.parse_buffer(s.read(n))
        if msgs:
            for m in msgs:
                mtype = m.get_type()
                if mtype == 'ATTITUDE':
                    roll = math.degrees(m.roll)
                    pitch = math.degrees(m.pitch)
                    yaw = math.degrees(m.yaw)
                elif mtype == 'GLOBAL_POSITION_INT':
                    if m.hdg != 65535:
                        heading = m.hdg / 100.0

    # Print every 0.3 seconds
    if time.time() - last_print >= 0.3:
        last_print = time.time()
        curr_t = time.strftime("%H:%M:%S")
        r_str = f"{roll:+6.1f}°"
        p_str = f"{pitch:+6.1f}°"
        y_str = f"{yaw:+6.1f}°"
        h_str = f"{heading:5.1f}°"
        
        # Simple visual roll indicator
        if roll > 5.0:
            tilt = "➡️ Tilt RIGHT"
        elif roll < -5.0:
            tilt = "⬅️ Tilt LEFT"
        elif pitch > 5.0:
            tilt = "⬇️ Nose DOWN"
        elif pitch < -5.0:
            tilt = "⬆️ Nose UP"
        else:
            tilt = "✅ LEVEL"

        print(f"{curr_t:<8} | {r_str:<10} | {p_str:<10} | {y_str:<10} | {h_str:<10} | {tilt}")

    time.sleep(0.02)

s.close()
print("-" * 70)
print("✅ Live monitor complete!")

