#!/usr/bin/env python3
"""
EcoScrapPickup Simulation Startup Script
This script helps start both the simulation server and check CoppeliaSim connection.
"""

import os
import sys
import subprocess
import time
import requests
import threading
from pathlib import Path

class SimulationLauncher:
    def __init__(self):
        self.base_dir = Path(__file__).parent
        self.sim_server_path = self.base_dir / "sim_server.py"
        
    def check_coppeliasim(self):
        """Check if CoppeliaSim is running and accessible."""
        print("🔍 Checking CoppeliaSim connection...")
        try:
            # This will be checked by the sim_server.py when it starts
            print("✅ CoppeliaSim check will be performed by sim_server.py")
            return True
        except Exception as e:
            print(f"❌ CoppeliaSim not accessible: {e}")
            return False
    
    def start_simulation_server(self):
        """Start the Flask simulation server."""
        print("🚀 Starting simulation server...")
        try:
            # Change to the correct directory and run the simulation server
            env = os.environ.copy()
            env['PYTHONPATH'] = str(self.base_dir)
            
            process = subprocess.Popen(
                [sys.executable, str(self.sim_server_path)],
                cwd=str(self.base_dir),
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            
            return process
        except Exception as e:
            print(f"❌ Failed to start simulation server: {e}")
            return None
    
    def check_simulation_server_health(self, max_retries=10, delay=2):
        """Check if simulation server is responding."""
        for i in range(max_retries):
            try:
                response = requests.post("http://localhost:5001/reset_mission", timeout=3)
                if response.status_code == 200:
                    print("✅ Simulation server is responding!")
                    return True
            except requests.exceptions.ConnectionError:
                print(f"⏳ Waiting for simulation server to start... ({i+1}/{max_retries})")
                time.sleep(delay)
            except Exception as e:
                print(f"⚠️ Health check error: {e}")
                time.sleep(delay)
        
        print("❌ Simulation server did not start properly")
        return False
    
    def stream_output(self, process, prefix="[SIM]"):
        """Stream process output in real-time."""
        try:
            for line in iter(process.stdout.readline, ''):
                if line:
                    print(f"{prefix} {line.strip()}")
        except Exception as e:
            print(f"{prefix} Output stream error: {e}")
    
    def main(self):
        print("=" * 60)
        print("🤖 EcoScrapPickup Simulation Launcher")
        print("=" * 60)
        
        # Check if sim_server.py exists
        if not self.sim_server_path.exists():
            print(f"❌ sim_server.py not found at: {self.sim_server_path}")
            return False
        
        print(f"📁 Working directory: {self.base_dir}")
        print(f"🐍 Python executable: {sys.executable}")
        
        # Start simulation server
        sim_process = self.start_simulation_server()
        if not sim_process:
            return False
        
        # Stream output in a separate thread
        output_thread = threading.Thread(
            target=self.stream_output, 
            args=(sim_process, "[SIM]"),
            daemon=True
        )
        output_thread.start()
        
        # Wait for server to be ready
        if not self.check_simulation_server_health():
            sim_process.terminate()
            return False
        
        print("\n" + "=" * 60)
        print("🎉 SIMULATION SETUP COMPLETE!")
        print("=" * 60)
        print("🌐 Simulation server running on: http://localhost:5001")
        print("🎮 Make sure CoppeliaSim is running with your scene loaded")
        print("🔗 Your backend can now control the simulation!")
        print("\n📋 Available endpoints:")
        print("   POST /start_mission  - Start pickup mission")
        print("   POST /stop_mission   - Stop current mission")
        print("   POST /resume_mission - Resume paused mission")
        print("   POST /reset_mission  - Reset mission state")
        print("\n⌨️  Press Ctrl+C to stop the simulation server")
        print("=" * 60)
        
        try:
            # Keep the process running
            sim_process.wait()
        except KeyboardInterrupt:
            print("\n🛑 Shutting down simulation server...")
            sim_process.terminate()
            try:
                sim_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                sim_process.kill()
            print("✅ Simulation server stopped")
        
        return True

if __name__ == "__main__":
    launcher = SimulationLauncher()
    success = launcher.main()
    sys.exit(0 if success else 1)