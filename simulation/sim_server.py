import sys
sys.path.append("C:\\Program Files\\CoppeliaRobotics\\CoppeliaSimEdu\\programming\\zmqRemoteApi\\clients\\python\\src")

from coppeliasim_zmqremoteapi_client import RemoteAPIClient
from flask import Flask, request, jsonify
import time

app = Flask(__name__)

# Initialize CoppeliaSim connection
try:
    client = RemoteAPIClient()
    sim = client.getObject('sim')
    print("Connected to CoppeliaSim successfully!")
    print(f"CoppeliaSim version: {sim.getStringParam(sim.stringparam_application_path)}")
    coppeliasim_connected = True
except Exception as e:
    print(f"Failed to connect to CoppeliaSim: {e}")
    print("Make sure CoppeliaSim is running and the Remote API is enabled")
    coppeliasim_connected = False
    sim = None

@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'online',
        'service': 'EcoScrapPickup Simulation Server',
        'coppeliasim_connected': coppeliasim_connected,
        'timestamp': time.time()
    })

@app.route('/start_mission', methods=['POST'])
def start_mission():
    if not coppeliasim_connected or sim is None:
        return jsonify({
            'status': 'error', 
            'message': 'CoppeliaSim is not connected. Please ensure CoppeliaSim is running.'
        }), 503
    
    try:
        print("Starting mission...")
        sim.setInt32Signal('startMission', 1)
        print("Mission signal sent to CoppeliaSim")
        return jsonify({'status': 'mission_started'})
    except Exception as e:
        print(f"Failed to start mission: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/stop_mission', methods=['POST'])
def stop_mission():
    if not coppeliasim_connected or sim is None:
        return jsonify({
            'status': 'error', 
            'message': 'CoppeliaSim is not connected. Please ensure CoppeliaSim is running.'
        }), 503
    
    try:
        print("Stopping mission...")
        sim.setInt32Signal('stopMission', 1)
        print("Stop signal sent to CoppeliaSim")
        return jsonify({'status': 'mission_stopped'})
    except Exception as e:
        print(f"Failed to stop mission: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/resume_mission', methods=['POST'])
def resume_mission():
    if not coppeliasim_connected or sim is None:
        return jsonify({
            'status': 'error', 
            'message': 'CoppeliaSim is not connected. Please ensure CoppeliaSim is running.'
        }), 503
    
    try:
        print("Resuming mission...")
        sim.setInt32Signal('resumeMission', 1)
        print("Resume signal sent to CoppeliaSim")
        return jsonify({'status': 'mission_resumed'})
    except Exception as e:
        print(f"Failed to resume mission: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/reset_mission', methods=['POST'])
def reset_mission():
    if not coppeliasim_connected or sim is None:
        return jsonify({
            'status': 'error', 
            'message': 'CoppeliaSim is not connected. Please ensure CoppeliaSim is running.'
        }), 503
    
    try:
        print("Resetting mission...")
        sim.setInt32Signal('resetMission', 1)
        print("Reset signal sent to CoppeliaSim")
        return jsonify({'status': 'mission_reset'})
    except Exception as e:
        print(f"Failed to reset mission: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/check_mission_status', methods=['POST'])
def check_mission_status():
    if not coppeliasim_connected or sim is None:
        return jsonify({
            'status': 'error', 
            'message': 'CoppeliaSim is not connected. Please ensure CoppeliaSim is running.'
        }), 503
    
    try:
        # Check for mission completion signal from CoppeliaSim
        completion_signal = None
        print(f"Checking for missionCompleted signal...")
        
        try:
            completion_signal = sim.getInt32Signal('missionCompleted')
            print(f"Signal value: {completion_signal}")
        except Exception as signal_error:
            print(f"Could not read signal (simulation may not be running): {signal_error}")
            return jsonify({'status': 'running'})
        
        if completion_signal and completion_signal == 1:
            print("Mission completion detected!")
            # Clear the signal so it doesn't trigger again
            try:
                sim.clearInt32Signal('missionCompleted')
            except Exception as clear_error:
                print(f"Could not clear signal: {clear_error}")
            return jsonify({'status': 'completed'})
        else:
            return jsonify({'status': 'running'})
            
    except Exception as e:
        print(f"Failed to check mission status: {e}")
        return jsonify({'status': 'running'})  # Return 'running' instead of error to keep checking

if __name__ == '__main__':
    print("=" * 60)
    print("EcoScrapPickup Simulation Server")
    print("=" * 60)
    print("Starting Flask server on http://localhost:5002")
    print("Make sure CoppeliaSim is running with your scene loaded")
    print("Backend integration ready!")
    print("=" * 60)
    
    try:
        app.run(host='0.0.0.0', port=5002, debug=False)
    except KeyboardInterrupt:
        print("\nSimulation server stopped by user")
    except Exception as e:
        print(f"\nServer error: {e}")
        print("Make sure port 5002 is not already in use")
