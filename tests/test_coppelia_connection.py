#!/usr/bin/env python3
"""
Test CoppeliaSim connection and signal access
"""
import zmq
import time

def test_coppelia_connection():
    """Test basic connection to CoppeliaSim"""
    try:
        # Try to connect to CoppeliaSim Remote API
        import sim
        
        print("🔌 Testing CoppeliaSim connection...")
        
        # Close any existing connections
        sim.simxFinish(-1)
        
        # Connect to CoppeliaSim
        clientID = sim.simxStart('127.0.0.1', 19997, True, True, 5000, 5)
        
        if clientID != -1:
            print("✅ Connected to CoppeliaSim successfully!")
            
            # Test signal access
            print("🔍 Testing signal access...")
            
            # Try to read a signal (should return error if no signal exists, but connection works)
            returnCode, signalValue = sim.simxGetIntegerSignal(clientID, 'missionCompleted', sim.simx_opmode_oneshot_wait)
            
            if returnCode == sim.simx_return_ok:
                print(f"✅ Signal 'missionCompleted' value: {signalValue}")
            elif returnCode == sim.simx_return_remote_error_flag:
                print("⚠️ Signal 'missionCompleted' not found (normal if not set)")
            else:
                print(f"⚠️ Signal access returned code: {returnCode}")
            
            # Test setting a signal
            print("🔧 Testing signal setting...")
            returnCode = sim.simxSetIntegerSignal(clientID, 'testSignal', 999, sim.simx_opmode_oneshot)
            
            if returnCode == sim.simx_return_ok:
                print("✅ Successfully set test signal")
            else:
                print(f"❌ Failed to set signal, code: {returnCode}")
            
            # Test reading back the signal
            time.sleep(0.1)
            returnCode, signalValue = sim.simxGetIntegerSignal(clientID, 'testSignal', sim.simx_opmode_oneshot_wait)
            
            if returnCode == sim.simx_return_ok:
                print(f"✅ Read back test signal value: {signalValue}")
            else:
                print(f"❌ Failed to read back signal, code: {returnCode}")
            
            # Check simulation state
            returnCode, simulationState = sim.simxGetInMessageInfo(clientID, sim.simx_headeroffset_server_state)
            print(f"🎮 Simulation state info: {simulationState}")
            
            # Clean up
            sim.simxSetIntegerSignal(clientID, 'testSignal', 0, sim.simx_opmode_oneshot)
            sim.simxFinish(clientID)
            
            return True
            
        else:
            print("❌ Failed to connect to CoppeliaSim!")
            print("🔧 Make sure:")
            print("   - CoppeliaSim is running")
            print("   - Remote API is enabled")
            print("   - Port 19997 is accessible")
            return False
            
    except ImportError:
        print("❌ CoppeliaSim 'sim' module not found!")
        print("🔧 Make sure CoppeliaSim Python bindings are installed")
        return False
    except Exception as e:
        print(f"❌ Connection test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_coppelia_connection()
    if success:
        print("\n🎉 CoppeliaSim connection test PASSED!")
    else:
        print("\n💥 CoppeliaSim connection test FAILED!")