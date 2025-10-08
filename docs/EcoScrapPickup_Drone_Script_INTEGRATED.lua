-- EcoScrapPickup Drone Mission Script (Integrated with Backend)
-- This script handles drone pickup missions and communicates with the backend
local descendStartTime = nil
local descendDuration = 5 -- seconds for gradual descent

function sysCall_init()
    droneTarget = sim.getObject('/base/target') -- adjust if different
    pickup = sim.getObject('/dummy[0]')
    hub = sim.getObject('/dummy[1]')
    item = sim.getObject('/E_waste')

    -- Flight parameters
    flightSpeed = 0.05       -- max speed of the target dummy movement
    hoverHeight = 3          -- hover above points
    descendHeight = 0.5      -- height to pick/drop object
    restOffset = {x=0, y=0, z=0.2} -- final rest position offset from hub

    -- Phase control
    phase = 0
    missionActive = false
    missionCompleted = false -- Track if mission has been completed
    
    -- Clear any existing signals
    sim.clearInt32Signal('missionCompleted')
    
    print("🤖 EcoScrapPickup Drone Mission initialized")
end

function distance(p1, p2)
    local dx = p1[1]-p2[1]
    local dy = p1[2]-p2[2]
    local dz = p1[3]-p2[3]
    return math.sqrt(dx*dx + dy*dy + dz*dz)
end

function moveTowards(current, target, step)
    local dx = target[1]-current[1]
    local dy = target[2]-current[2]
    local dz = target[3]-current[3]
    local dist = math.sqrt(dx*dx + dy*dy + dz*dz)
    if dist < step then
        return {target[1], target[2], target[3]}, true
    else
        return {current[1]+dx/dist*step, current[2]+dy/dist*step, current[3]+dz/dist*step}, false
    end
end

-- Full reset function
function resetMission()
    missionActive = false
    missionCompleted = false
    phase = 0
    descendStartTime = nil

    -- Reset drone to base height
    local basePos = sim.getObjectPosition(droneTarget, -1)
    sim.setObjectPosition(droneTarget, -1, {basePos[1], basePos[2], 0})

    -- Detach and reset item
    sim.setObjectParent(item, -1, true)
    sim.setObjectInt32Param(item, sim.shapeintparam_static, 0)

    -- Move item back to pickup
    local pickupPos = sim.getObjectPosition(pickup, -1)
    sim.setObjectPosition(item, -1, pickupPos)

    -- Clear completion signal
    sim.clearInt32Signal('missionCompleted')

    print("🔄 Mission fully reset")
end

-- Signal mission completion to backend
function completeMission()
    if not missionCompleted then
        missionCompleted = true
        missionActive = false
        
        -- Send completion signal to backend
        sim.setInt32Signal('missionCompleted', 1)
        
        print("🎯 MISSION COMPLETED - Signal sent to backend!")
        print("✅ Drone pickup mission finished successfully")
    end
end

function sysCall_actuation()
    -- Check for mission control signals from backend
    
    -- Start mission
    local startSignal = sim.getInt32Signal('startMission')
    if startSignal and startSignal == 1 and not missionActive then
        missionActive = true
        missionCompleted = false
        phase = 0
        descendStartTime = nil
        print("🚀 Mission started by backend signal")
        sim.clearInt32Signal('startMission')
    end

    -- Stop (pause) mission
    local stopSignal = sim.getInt32Signal('stopMission')
    if stopSignal and stopSignal == 1 and missionActive then
        missionActive = false
        print("⏸️ Mission stopped (paused) by backend signal")
        sim.clearInt32Signal('stopMission')
    end

    -- Resume mission
    local resumeSignal = sim.getInt32Signal('resumeMission')
    if resumeSignal and resumeSignal == 1 and not missionActive and not missionCompleted then
        missionActive = true
        print("▶️ Mission resumed by backend signal")
        sim.clearInt32Signal('resumeMission')
    end

    -- Reset mission
    local resetSignal = sim.getInt32Signal('resetMission')
    if resetSignal and resetSignal == 1 then
        resetMission()
        sim.clearInt32Signal('resetMission')
    end

    -- Only run mission if active and not completed
    if missionActive and not missionCompleted then
        local currentPos = sim.getObjectPosition(droneTarget, -1)
        local targetPos

        if phase == 0 then
            -- Takeoff and hover above pickup
            local pickupPos = sim.getObjectPosition(pickup, -1)
            targetPos = {pickupPos[1], pickupPos[2], pickupPos[3] + hoverHeight}
            local distToTarget = distance(currentPos, targetPos)
            local adjustedSpeed = math.min(flightSpeed, distToTarget * 0.5)
            local newPos, _ = moveTowards(currentPos, targetPos, adjustedSpeed)
            sim.setObjectPosition(droneTarget, -1, newPos)
            if distToTarget < 0.1 then 
                phase = 1 
                print("📍 Phase 1: Hovering above pickup point")
            end

        elseif phase == 1 then
            -- Descend to pickup
            local pickupPos = sim.getObjectPosition(pickup, -1)
            local targetPosHover = {pickupPos[1], pickupPos[2], pickupPos[3] + hoverHeight}
            local targetPosDescend = {pickupPos[1], pickupPos[2], pickupPos[3] + descendHeight}

            if not descendStartTime then descendStartTime = sim.getSimulationTime() end
            local elapsed = sim.getSimulationTime() - descendStartTime
            local frac = math.min(1, elapsed / descendDuration)
            local zPos = targetPosHover[3] - frac * (targetPosHover[3] - targetPosDescend[3])
            targetPos = {pickupPos[1], pickupPos[2], zPos}

            local distToTarget = distance(currentPos, targetPos)
            local adjustedSpeed = math.min(flightSpeed, distToTarget * 0.5)
            local newPos, _ = moveTowards(currentPos, targetPos, adjustedSpeed)
            sim.setObjectPosition(droneTarget, -1, newPos)

            if frac == 1 and distance(newPos, targetPosDescend) < 0.05 then
                sim.setObjectParent(item, droneTarget, false)
                sim.setObjectPosition(item, droneTarget, {0.1, 0, -descendHeight + 0.1})
                sim.setObjectInt32Param(item, sim.shapeintparam_static, 1)
                print("🏗️ Item picked up successfully")
                phase = 2
                descendStartTime = nil
            end

        elseif phase == 2 then
            -- Fly above hub
            local hubPos = sim.getObjectPosition(hub, -1)
            targetPos = {hubPos[1], hubPos[2], hubPos[3] + hoverHeight}
            local distToTarget = distance(currentPos, targetPos)
            local adjustedSpeed = math.min(flightSpeed, distToTarget * 0.5)
            local newPos, _ = moveTowards(currentPos, targetPos, adjustedSpeed)
            sim.setObjectPosition(droneTarget, -1, newPos)
            if distToTarget < 0.1 then 
                phase = 3 
                print("📍 Phase 3: Hovering above drop-off point")
            end

        elseif phase == 3 then
            -- Descend to hub
            local hubPos = sim.getObjectPosition(hub, -1)
            targetPos = {hubPos[1], hubPos[2], hubPos[3] + descendHeight}
            local distToTarget = distance(currentPos, targetPos)
            local adjustedSpeed = math.min(flightSpeed, distToTarget * 0.5)
            local newPos, _ = moveTowards(currentPos, targetPos, adjustedSpeed)
            sim.setObjectPosition(droneTarget, -1, newPos)

            if distToTarget < 0.1 then
                sim.setObjectParent(item, -1, true)
                sim.setObjectInt32Param(item, sim.shapeintparam_static, 0)
                print("📦 Item dropped off successfully")
                
                -- ✅ MISSION COMPLETION - Trigger auto-completion immediately when item is dropped
                completeMission()
                
                phase = 4
            end

        elseif phase == 4 then
            -- Move to final rest position above hub
            local hubPos = sim.getObjectPosition(hub, -1)
            targetPos = {hubPos[1] + restOffset.x, hubPos[2] + restOffset.y, hubPos[3] + restOffset.z}
            local distToTarget = distance(currentPos, targetPos)
            local adjustedSpeed = math.min(flightSpeed, distToTarget * 0.5)
            local newPos, reached = moveTowards(currentPos, targetPos, adjustedSpeed)
            sim.setObjectPosition(droneTarget, -1, newPos)

            if reached then
                print("🏠 Drone reached final rest position")
                -- Mission already completed in Phase 3, just maintaining final position
            end
        end
    end
end

function sysCall_cleanup()
    -- Cleanup when simulation ends
    sim.clearInt32Signal('startMission')
    sim.clearInt32Signal('stopMission')
    sim.clearInt32Signal('resumeMission')
    sim.clearInt32Signal('resetMission')
    sim.clearInt32Signal('missionCompleted')
    
    print("🧹 Drone mission cleanup completed")
end