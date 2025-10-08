# 🤖 EcoScrapPickup Simulation - Quick Reference Guide

## 🎯 What is the Simulation System?

The **EcoScrapPickup Simulation System** is a cutting-edge integration between your web application and **CoppeliaSim** (3D robotics simulator) that demonstrates **automated drone-based e-waste pickup**.

---

## 🏗️ System Architecture (Simplified)

```
Web App → Backend → Flask Server → CoppeliaSim → 3D Drone Simulation
   ↑                                                        ↓
User Dashboard ←————————— Real-time Updates ←——————————————┘
```

---

## 🔄 Complete Workflow

1. **👤 User** submits pickup request via web app
2. **👨‍💼 Admin** accepts request in dashboard  
3. **🚀 System** automatically starts drone mission in CoppeliaSim
4. **🤖 Drone** navigates to pickup location in 3D simulation
5. **📡 System** monitors mission progress every 0.5 seconds
6. **✅ Auto-completion** when mission finishes (or 1-minute timeout fallback)
7. **🎉 User** gets notification with points awarded

---

## 📁 Key Files

| File | Purpose | Technology |
|------|---------|------------|
| `sim_server.py` | Flask server controlling CoppeliaSim (Port 5002) | Python + Flask |
| `simulationService.ts` | Backend mission management service | TypeScript |
| `admin.tsx` | Admin control dashboard with real-time updates | React + TanStack Query |
| `EcoScrapPickup demo.ttt` | 3D drone simulation scene file | CoppeliaSim |
| `start_simulation.py` | Automated launcher with health checks | Python |

---

## 🎮 How to Run

### **Quick Start (Windows):**
```bash
# 1. Start CoppeliaSim with scene loaded
# 2. Double-click:
start_simulation.bat

# 3. Start your backend:
npm run dev

# 4. Test in admin dashboard!
```

### **Manual Start:**
```bash
# Terminal 1: CoppeliaSim (load EcoScrapPickup demo.ttt)
# Terminal 2: 
python sim_server.py

# Terminal 3:
npm run dev
```

---

## 🎛️ Admin Dashboard Controls

In `/admin`, you'll see **Simulation Control Center** with:

- **🟢/🔴 Status**: Online/Offline indicator  
- **▶️ Resume**: Continue paused mission
- **⏸️ Stop**: Pause current mission
- **✅ Complete**: Force finish mission now  
- **🔄 Reset**: Reset simulation state

---

## 🔧 API Endpoints

**Simulation Server** (`sim_server.py` on `localhost:5002`):
- `GET /` - Health check
- `POST /start_mission` - Start drone pickup
- `POST /stop_mission` - Emergency stop
- `POST /resume_mission` - Resume paused mission
- `POST /reset_mission` - Reset state
- `POST /check_mission_status` - Check completion

**Backend API** (`localhost:3000`):
- `GET /api/simulation/status` - Get mission status
- `POST /api/simulation/stop` - Stop mission
- `POST /api/simulation/resume` - Resume mission  
- `POST /api/simulation/reset` - Reset mission
- `POST /api/simulation/complete` - Force complete

---

## 🎯 What Happens When You Accept a Pickup?

1. **Request status** → "in-progress"
2. **Drone mission** starts automatically in CoppeliaSim
3. **User notification**: "🚁 Drone heading to your location!"
4. **Admin dashboard** shows mission running
5. **Real-time monitoring** every 0.5 seconds  
6. **After ~1 minute**: Auto-completes (if no CoppeliaSim signal received)
7. **Points awarded** to user (50 points/kg)
8. **Certificate created** for user achievements
9. **Mission resets** for next pickup

---

## 🚨 Troubleshooting

**❌ "Simulation Offline"**
- Make sure CoppeliaSim is running with scene loaded (`EcoScrapPickup demo.ttt`)
- Restart `sim_server.py` (should show "Starting Flask server on http://localhost:5002")
- Check port 5002 is not in use: `netstat -an | findstr 5002`
- Verify CoppeliaSim Remote API is enabled (default: enabled)

**❌ "Mission Won't Start"**  
- Verify CoppeliaSim scene is properly loaded
- Check `sim_server.py` console for connection errors
- Try manual reset in admin dashboard → "Reset" button
- Restart both CoppeliaSim and `sim_server.py`

**❌ "Mission Stuck Running"**
- Use "Complete" button in admin dashboard for immediate completion
- Check if 1-minute auto-timeout is working (fallback mechanism)
- Monitor backend logs for auto-completion attempts
- Restart simulation server if status monitoring fails

**⚠️ Port Confusion Note:**
- **Simulation Server**: `sim_server.py` runs on **Port 5002**  
- **ML Model Server**: `model_server.py` runs on **Port 5001**
- Don't confuse the two - simulation uses **5002**!

---

## 🎉 Key Features

✅ **Fully Automated**: Zero manual work for normal pickups  
✅ **Real-time Updates**: Live status in admin dashboard  
✅ **Smart Fallbacks**: Manual controls if automation fails  
✅ **Professional UI**: Clean, intuitive admin interface  
✅ **Robust Error Handling**: Graceful failure recovery  
✅ **Future-Ready**: Architecture supports real drones  

---

## 📈 Innovation Highlights

**🌟 Cutting-edge Integration:**
- Web app directly controls 3D robotics simulation
- Real-time bidirectional communication
- Professional-grade mission management system

**🌟 Practical Demonstration:**
- Shows how real drone pickup would work
- Engaging user experience with visual feedback  
- Scalable architecture for future expansion

**🌟 Technical Excellence:**
- TypeScript + Python integration
- REST API + Signal-based communication
- React dashboard with real-time updates

---

**🚀 This simulation system showcases the future of automated e-waste collection through immersive 3D demonstration!**

---

*📖 For complete technical details, see: `docs/COMPLETE_SIMULATION_DOCUMENTATION.md`*