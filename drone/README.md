# 🚁 EcoScrap Real Drone Integration

Complete guide to integrate the physical ESP32-based drone with the EcoScrap Pickup application.

---

## 📁 File Structure Created

```
drone/
├── esp32/
│   ├── air_unit/air_unit.ino       ← Flash onto ESP32 on the DRONE
│   └── ground_unit/ground_unit.ino ← Flash onto ESP32 plugged into PC
├── config.py                        ← ALL tunable parameters HERE
├── drone_controller.py              ← MAVLink command interface
├── telemetry_monitor.py             ← Background telemetry reader
├── mission_planner.py               ← Address/GPS → waypoint mission
├── safety_manager.py                ← Pre-flight + in-flight watchdogs
├── drone_bridge_server.py           ← Flask server (replaces sim_server.py)
├── requirements_drone.txt           ← Python dependencies
├── start_drone.bat                  ← Windows one-click start
└── README.md                        ← This file
```

---

## ⚡ Quick Setup Checklist

### Step 1 — Arduino IDE Setup

1. Open Arduino IDE
2. Install ESP32 board support:
   - File → Preferences → Additional Board URLs:
     `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   - Tools → Board Manager → Search "esp32" → Install **esp32 by Espressif**

### Step 2 — Flash Ground Unit (PC-side ESP32)

1. Plug **ground unit** ESP32 into PC via USB-C
2. Open `esp32/ground_unit/ground_unit.ino` in Arduino IDE
3. Select: Tools → Board → **ESP32 Dev Module**
4. Select correct COM port (check Device Manager)
5. Upload sketch
6. Open Serial Monitor (115200 baud)
7. Note the line: `#ECOSCRAP_GND MAC=XX:XX:XX:XX:XX:XX`
8. **Copy this MAC address**

### Step 3 — Configure Air Unit MAC in Ground Unit

The air unit MAC is needed AFTER you flash the air unit. Come back to this step after Step 4.

### Step 4 — Flash Air Unit (Drone ESP32)

1. Open `esp32/air_unit/air_unit.ino`
2. Paste the **ground unit MAC** into `GROUND_UNIT_MAC[]`:
   ```cpp
   // Example: if ground MAC is AA:BB:CC:DD:EE:FF
   uint8_t GROUND_UNIT_MAC[6] = {0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF};
   ```
3. Plug air unit ESP32 into PC temporarily
4. Upload sketch
5. Open Serial Monitor (115200 baud)
6. Note the `[AIR] Air Unit MAC: XX:XX:XX:XX:XX:XX`
7. **Copy this MAC**

### Step 5 — Configure Air Unit MAC in Ground Unit

1. Open `esp32/ground_unit/ground_unit.ino`
2. Paste air unit MAC into `AIR_UNIT_MAC[]`
3. Re-upload to ground unit ESP32
4. Unplug air unit from PC — mount it on drone

### Step 6 — Wire Air Unit to Flight Controller

```
Air Unit ESP32          Cross Flight Controller
─────────────           ──────────────────────
GPIO16 (RX2)    ──────► TELEM1 TX
GPIO17 (TX2)    ◄─────  TELEM1 RX  
GND             ──────► GND
VIN             ──────► 5V BEC output
```

> **Note:** Cross FC TELEM1 is 3.3V logic. Direct connection is safe.
> Power ESP32 from BEC 5V output → VIN pin (NOT 3.3V pin directly from battery).

### Step 7 — ArduCopter FC Configuration (via Mission Planner)

Connect FC to PC via USB and open Mission Planner:

| Parameter | Value | Description |
|---|---|---|
| `SERIAL1_PROTOCOL` | `2` | MAVLink 2 on TELEM1 |
| `SERIAL1_BAUD` | `57` | 57600 baud |
| `ATC_ACCEL_P_MAX` | Default | Leave at default |
| `WPNAV_SPEED` | `500` | 5 m/s (500 cm/s) cruise |
| `WPNAV_RADIUS` | `200` | 2m waypoint acceptance radius |
| `RTL_ALT` | `1500` | 15m RTL altitude (cm) |
| `FENCE_ENABLE` | `1` | Enable ArduCopter geofence |
| `FENCE_RADIUS` | `600` | 600m geofence radius |

After setting parameters:
1. Do **accelerometer calibration**
2. Do **compass calibration**
3. Do **ESC calibration**
4. Set **home position** at your launch pad

### Step 8 — Servo Wiring

```
Flight Controller AUX Outputs → Servos
───────────────────────────────────────
AUX1 (Ch9)  → MG996R continuous rotation servo (WINCH)
AUX2 (Ch10) → 9g SG90 servo (LATCH/RELEASE at depot)
```

ArduCopter servo channel numbering: AUX1 = Ch9, AUX2 = Ch10, etc.

Set in Mission Planner:
- `SERVO9_FUNCTION = 0` (pass-through, controlled by MAVLink)
- `SERVO10_FUNCTION = 0`

### Step 9 — Configure `config.py`

Open `drone/config.py` and update:

```python
DRONE_SERIAL_PORT = "COM4"      # ← COM port of ground ESP32 (check Device Manager)

BASE_LAT  = 12.9716             # ← Your launch pad latitude
BASE_LON  = 77.5946             # ← Your launch pad longitude

DEPOT_LAT = 12.9750             # ← Recycling facility latitude  
DEPOT_LON = 77.5980             # ← Recycling facility longitude
```

### Step 10 — Install Python Dependencies

```bash
cd drone
pip install -r requirements_drone.txt
```

### Step 11 — Start Everything

**Terminal 1: Drone Bridge Server**
```bash
cd EcoScrapPickup/drone
python drone_bridge_server.py
```
Or double-click `start_drone.bat`

**Terminal 2: EcoScrap Backend**
```bash
cd EcoScrapPickup
npm run dev
```

The `.env` already has `DRONE_BRIDGE_URL=http://localhost:5003` which connects to the drone bridge.

---

## 🔄 Toggle: Simulation ↔ Real Drone

Edit `.env`:
```
DRONE_BRIDGE_URL=http://localhost:5002  # → CoppeliaSim simulation
DRONE_BRIDGE_URL=http://localhost:5003  # → Real drone
```

No other changes needed.

---

## 🗺️ Mission Flow

When admin accepts a pickup request:

```
1. Admin clicks "Accept" in EcoScrap admin panel
2. Backend calls simulationService.startMission(requestId)
3. simulationService fetches lat/lon from DB
4. POST /start_mission → drone_bridge_server.py
5. Pre-flight safety check runs
6. FC arms, drone takes off to 10m
7. Drone flies to user's GPS location (from pickup request)
8. Drone switches to LOITER — holds position precisely
9. Winch servo unwinds → bag descends on string
10. 60-second window: user places e-waste in bag
11. Winch servo winds → bag rises with items
12. Drone flies to recycling depot GPS
13. Latch servo opens → items drop into bin
14. Drone RTL → lands at base → disarms
15. drone_bridge_server sets mission completed
16. Backend auto-fires: EcoPoints + Certificate + Notification 🎉
```

---

## 🛡️ Safety Features

| Watchdog | Threshold | Action |
|---|---|---|
| Battery low | < 20% | Auto RTL |
| Battery critical | < 10% | Emergency land |
| Telemetry lost | > 8 seconds | RTL → Land |
| Geofence breach | > 600m from base | RTL |
| FlySky override | Any time | RC takes full priority |
| Pre-flight gate | Before arming | Blocks mission if GPS/battery/mode not ready |

---

## 🔍 Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| "No heartbeat received" | Wrong COM port or ESP32 not bridging | Check Device Manager, verify both ESP32 MACs match |
| "GPS fix insufficient" | Poor GPS signal | Move outdoors, wait 2-3 min for 3D fix |
| "Motor arm failed" | Pre-arm failure in ArduCopter | Open Mission Planner → Messages tab to see which pre-arm check failed |
| Drone drifts at pickup | GPS accuracy (3-5m typical) | Increase `POSITION_HOLD_RADIUS` in config.py |
| Winch not working | Wrong servo channel or PWM | Verify `SERVO9_FUNCTION=0` in Mission Planner, check AUX1 wiring |
| ESP-NOW no link | MAC addresses not matching | Re-do Step 5-6, verify hex values exactly |

---

## 📡 Live Telemetry API

While drone is flying, call `GET http://localhost:5003/telemetry` to get:

```json
{
  "lat": 12.9716,
  "lon": 77.5946,
  "altitude_m": 10.2,
  "heading_deg": 245.0,
  "speed_ms": 4.8,
  "battery_pct": 78,
  "battery_voltage": 11.3,
  "mode": "GUIDED",
  "armed": true,
  "gps_fix": 3,
  "satellites": 9,
  "distance_to_home": 123.4,
  "mission_phase": "TO_PICKUP"
}
```

This can be displayed in the admin dashboard's drone panel using simple polling.
