-- EcoScrapPickup Mission Control Script
-- Add this script to your main scene object in CoppeliaSim
-- This script handles mission control signals and completion detection

function sysCall_init()
    -- Initialize mission state variables
    missionRunning = false
    missionStarted = false
    pickupCompleted = false
    
    print("🤖 EcoScrapPickup Mission Control initialized")
end

function sysCall_actuation()
    -- Check for mission control signals
    
    -- START MISSION
    local startSignal = sim.getInt32Signal('startMission')
    if startSignal and startSignal == 1 then
        print("🚀 Mission START signal received!")
        startPickupMission()
        sim.clearInt32Signal('startMission')
    end
    
    -- STOP MISSION  
    local stopSignal = sim.getInt32Signal('stopMission')
    if stopSignal and stopSignal == 1 then
        print("⏸️ Mission STOP signal received!")
        stopPickupMission()
        sim.clearInt32Signal('stopMission')
    end
    
    -- RESUME MISSION
    local resumeSignal = sim.getInt32Signal('resumeMission')
    if resumeSignal and resumeSignal == 1 then
        print("▶️ Mission RESUME signal received!")
        resumePickupMission()
        sim.clearInt32Signal('resumeMission')
    end
    
    -- RESET MISSION
    local resetSignal = sim.getInt32Signal('resetMission')
    if resetSignal and resetSignal == 1 then
        print("🔄 Mission RESET signal received!")
        resetPickupMission()
        sim.clearInt32Signal('resetMission')
    end
    
    -- Check mission completion (customize this logic for your specific mission)
    if missionRunning then
        checkMissionCompletion()
    end
end

function startPickupMission()
    missionRunning = true
    missionStarted = true
    pickupCompleted = false
    
    print("✅ Pickup mission started!")
    
    -- Add your mission start logic here
    -- Examples:
    -- - Start drone/robot movement
    -- - Begin pickup sequence
    -- - Activate sensors
    
    -- Example: Start your robot's pickup sequence
    -- robot.startPickupSequence()
    
    -- Example mission completion after certain conditions
    -- This is where you'd add your actual mission logic
    missionStartTime = sim.getSimulationTime()
end

function stopPickupMission()
    missionRunning = false
    
    print("⏸️ Pickup mission paused!")
    
    -- Add your mission pause logic here
    -- Examples:
    -- - Pause robot movement
    -- - Save current state
    
    -- Example: Pause your robot
    -- robot.pauseMovement()
end

function resumePickupMission()
    if missionStarted and not pickupCompleted then
        missionRunning = true
        print("▶️ Pickup mission resumed!")
        
        -- Add your mission resume logic here
        -- Examples:
        -- - Resume robot movement
        -- - Continue from saved state
        
        -- Example: Resume your robot
        -- robot.resumeMovement()
    end
end

function resetPickupMission()
    missionRunning = false
    missionStarted = false
    pickupCompleted = false
    
    print("🔄 Pickup mission reset!")
    
    -- Add your mission reset logic here
    -- Examples:
    -- - Reset robot to start position
    -- - Clear mission state
    -- - Reset sensors
    
    -- Clear any completion signals
    sim.clearInt32Signal('missionCompleted')
    
    -- Example: Reset your robot
    -- robot.resetToStartPosition()
end

function checkMissionCompletion()
    -- CUSTOMIZE THIS FUNCTION FOR YOUR SPECIFIC MISSION COMPLETION CRITERIA
    
    local currentTime = sim.getSimulationTime()
    local missionDuration = currentTime - (missionStartTime or currentTime)
    
    -- Example completion conditions (customize these for your actual mission):
    
    -- METHOD 1: Time-based completion (for testing)
    if missionDuration > 30 then -- Complete after 30 seconds
        completeMission("Time limit reached")
        return
    end
    
    -- METHOD 2: Position-based completion (if robot reaches target)
    -- local robotPosition = sim.getObjectPosition(robotHandle, -1)
    -- local targetPosition = {x=1.0, y=1.0, z=0.5} -- Your target coordinates
    -- local distance = getDistance(robotPosition, targetPosition)
    -- if distance < 0.1 then -- Robot within 10cm of target
    --     completeMission("Target position reached")
    --     return
    -- end
    
    -- METHOD 3: Sensor-based completion (if item is picked up)
    -- local proximityReading = sim.readProximitySensor(proximitySensorHandle)
    -- if proximityReading == 0 then -- No object detected = item picked up
    --     completeMission("Item pickup detected")
    --     return
    -- end
    
    -- METHOD 4: Custom signal-based completion (set from other scripts)
    -- local customCompletion = sim.getInt32Signal('customMissionComplete')
    -- if customCompletion and customCompletion == 1 then
    --     completeMission("Custom completion signal received")
    --     sim.clearInt32Signal('customMissionComplete')
    --     return
    -- end
    
    -- Add your own completion logic here based on:
    -- - Robot position
    -- - Sensor readings  
    -- - Task completion status
    -- - Custom conditions specific to your mission
end

function completeMission(reason)
    if not pickupCompleted then
        pickupCompleted = true
        missionRunning = false
        
        print("🎯 MISSION COMPLETED: " .. (reason or "Unknown reason"))
        
        -- Signal completion to the backend
        sim.setInt32Signal('missionCompleted', 1)
        
        -- Add any cleanup or completion actions here
        -- Examples:
        -- - Return robot to home position
        -- - Save mission logs
        -- - Reset sensors
        
        print("✅ Mission completion signal sent to backend!")
    end
end

-- Helper function to calculate distance between two positions
function getDistance(pos1, pos2)
    local dx = pos1[1] - pos2[1]
    local dy = pos1[2] - pos2[2]  
    local dz = pos1[3] - pos2[3]
    return math.sqrt(dx*dx + dy*dy + dz*dz)
end

function sysCall_cleanup()
    -- Cleanup when simulation ends
    sim.clearInt32Signal('startMission')
    sim.clearInt32Signal('stopMission')
    sim.clearInt32Signal('resumeMission')
    sim.clearInt32Signal('resetMission')
    sim.clearInt32Signal('missionCompleted')
    
    print("🧹 Mission control cleanup completed")
end