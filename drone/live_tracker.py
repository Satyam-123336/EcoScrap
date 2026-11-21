import urllib.request
import json
import time
import sys

print("\n" + "=" * 65)
print(" 📡 LIVE WIRELESS TELEMETRY STREAM — TILT / ROTATE YOUR DRONE NOW!")
print("=" * 65)
print("{:<10} | {:<12} | {:<10} | {:<10} | {:<10}".format("TIME", "HEADING", "ALTITUDE", "BATTERY", "MODE"))
print("-" * 65)

t_end = time.time() + 20
directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]

while time.time() < t_end:
    try:
        with urllib.request.urlopen("http://localhost:5003/telemetry") as resp:
            data = json.loads(resp.read().decode())
            heading = data.get("heading_deg", 0)
            alt = data.get("altitude_m", 0)
            batt = data.get("battery_pct", 0)
            mode = data.get("mode", "UNKNOWN")
            
            d_idx = int((heading + 22.5) % 360 // 45)
            compass_dir = directions[d_idx]
            curr_time = time.strftime("%H:%M:%S")
            
            h_str = f"{heading:5.1f}° ({compass_dir})"
            alt_str = f"{alt:5.2f}m"
            batt_str = f"{batt}%"
            
            print(f"{curr_time:<10} | {h_str:<12} | {alt_str:<10} | {batt_str:<10} | {mode:<10}")
    except Exception as e:
        print("Error:", e)
    time.sleep(0.8)

print("-" * 65)
print("✅ Live monitor complete!")

