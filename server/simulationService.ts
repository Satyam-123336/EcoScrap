import axios from 'axios';
import { storage } from './storage';

interface SimulationResponse {
  status: string;
  message?: string;
}

interface MissionStatus {
  isRunning: boolean;
  requestId: string | null;
  startTime: Date | null;
}

class SimulationService {
  private readonly simulationServerUrl: string;
  private missionStatus: MissionStatus = {
    isRunning: false,
    requestId: null,
    startTime: null
  };
  private statusCheckInterval: NodeJS.Timeout | null = null;

  constructor(simulationServerUrl: string = 'http://localhost:5002') {
    this.simulationServerUrl = simulationServerUrl;
  }

  /**
   * Start a simulation mission for a pickup request
   */
  async startMission(requestId: string): Promise<boolean> {
    try {
      console.log(`Starting simulation mission for pickup request: ${requestId}`);
      
      // Check if simulation server is available
      const isAvailable = await this.checkSimulationServerHealth();
      if (!isAvailable) {
        console.error('Simulation server is not available');
        return false;
      }

      // Start the mission in CoppeliaSim
      const response = await axios.post<SimulationResponse>(
        `${this.simulationServerUrl}/start_mission`,
        {},
        { timeout: 5000 }
      );

      if (response.data.status === 'mission_started') {
        this.missionStatus = {
          isRunning: true,
          requestId,
          startTime: new Date()
        };
        
        console.log(`Mission started successfully for request ${requestId}`);
        
        // Start monitoring the mission status
        this.startStatusMonitoring();
        
        return true;
      } else {
        console.error(`Failed to start mission: ${response.data.message}`);
        return false;
      }
    } catch (error) {
      console.error('Error starting simulation mission:', error);
      return false;
    }
  }

  /**
   * Stop the current mission
   */
  async stopMission(): Promise<boolean> {
    try {
      console.log('Stopping simulation mission');
      
      const response = await axios.post<SimulationResponse>(
        `${this.simulationServerUrl}/stop_mission`,
        {},
        { timeout: 5000 }
      );

      if (response.data.status === 'mission_stopped') {
        this.stopStatusMonitoring();
        this.missionStatus = {
          isRunning: false,
          requestId: null,
          startTime: null
        };
        
        console.log('Mission stopped successfully');
        return true;
      } else {
        console.error(`Failed to stop mission: ${response.data.message}`);
        return false;
      }
    } catch (error) {
      console.error('Error stopping simulation mission:', error);
      return false;
    }
  }

  /**
   * Resume a paused mission
   */
  async resumeMission(): Promise<boolean> {
    try {
      console.log('Resuming simulation mission');
      
      const response = await axios.post<SimulationResponse>(
        `${this.simulationServerUrl}/resume_mission`,
        {},
        { timeout: 5000 }
      );

      if (response.data.status === 'mission_resumed') {
        console.log('Mission resumed successfully');
        return true;
      } else {
        console.error(`Failed to resume mission: ${response.data.message}`);
        return false;
      }
    } catch (error) {
      console.error('Error resuming simulation mission:', error);
      return false;
    }
  }

  /**
   * Reset the mission
   */
  async resetMission(): Promise<boolean> {
    try {
      console.log('Resetting simulation mission');
      
      const response = await axios.post<SimulationResponse>(
        `${this.simulationServerUrl}/reset_mission`,
        {},
        { timeout: 5000 }
      );

      if (response.data.status === 'mission_reset') {
        this.stopStatusMonitoring();
        this.missionStatus = {
          isRunning: false,
          requestId: null,
          startTime: null
        };
        
        console.log('Mission reset successfully');
        return true;
      } else {
        console.error(`Failed to reset mission: ${response.data.message}`);
        return false;
      }
    } catch (error) {
      console.error('Error resetting simulation mission:', error);
      return false;
    }
  }

  /**
   * Check if the simulation server is healthy and responsive
   */
  async checkSimulationServerHealth(): Promise<boolean> {
    try {
      // Try to make a simple request to check if server is running
      await axios.get(`${this.simulationServerUrl}/`, { timeout: 3000 });
      return true;
    } catch (error) {
      try {
        // If GET fails, try one of the mission endpoints to check if Flask server is responsive
        await axios.post(`${this.simulationServerUrl}/reset_mission`, {}, { timeout: 3000 });
        return true;
      } catch (secondError) {
        console.warn('Simulation server health check failed. Make sure CoppeliaSim and sim_server.py are running.');
        return false;
      }
    }
  }

  /**
   * Get current mission status
   */
  getMissionStatus(): MissionStatus {
    return { ...this.missionStatus };
  }

  /**
   * Start monitoring mission status and auto-complete when mission is done
   */
  private startStatusMonitoring(): void {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }

    console.log('Starting mission status monitoring...');
    
    this.statusCheckInterval = setInterval(async () => {
      await this.checkMissionCompletion();
    }, 500); // Check every 500ms for instant completion detection
  }

  /**
   * Stop status monitoring
   */
  private stopStatusMonitoring(): void {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
      console.log('Mission status monitoring stopped');
    }
  }

  /**
   * Check if mission is completed and auto-complete the pickup request
   */
  private async checkMissionCompletion(): Promise<void> {
    if (!this.missionStatus.isRunning || !this.missionStatus.requestId) {
      return;
    }

    try {
      // Check if mission has been running for a reasonable amount of time (e.g., 5 seconds minimum)
      const minRunTime = 5000; // 5 seconds - just to prevent immediate completion checks
      const currentTime = new Date().getTime();
      const startTime = this.missionStatus.startTime?.getTime() || currentTime;
      
      if (currentTime - startTime < minRunTime) {
        return; // Don't check completion too early
      }

      // You can add custom logic here to check mission completion
      // For now, we'll use a time-based approach or external signals
      
      // Example: Check if mission should be completed (this could be based on CoppeliaSim signals)
      const shouldComplete = await this.checkIfMissionShouldComplete();
      
      if (shouldComplete) {
        console.log(`Mission completed! Auto-completing pickup request: ${this.missionStatus.requestId}`);
        await this.autoCompletePickupRequest(this.missionStatus.requestId);
      }
    } catch (error) {
      console.error('Error checking mission completion:', error);
    }
  }

  /**
   * Check if mission should be completed based on actual CoppeliaSim status
   * This checks for a completion signal from CoppeliaSim instead of using time
   */
  private async checkIfMissionShouldComplete(): Promise<boolean> {
    try {
      // Check if mission completion signal is set in CoppeliaSim
      const response = await axios.post(`${this.simulationServerUrl}/check_mission_status`, {}, { timeout: 1000 });
      
      if (response.data.status === 'completed') {
        console.log('Mission completed signal received from CoppeliaSim - AUTO-COMPLETING NOW!');
        return true;
      }
      
      return false;
    } catch (error) {
      // Don't log every error to avoid spam, just check occasionally
      const currentTime = new Date().getTime();
      const startTime = this.missionStatus.startTime?.getTime() || currentTime;
      const runTime = currentTime - startTime;
      
      // Only use fallback after trying for at least 30 seconds
      if (runTime > 30000) {
        console.warn(`Could not check mission status from CoppeliaSim after ${Math.round(runTime/1000)}s`);
        
        // Fallback to time-based completion only if we can't communicate with CoppeliaSim
        const fallbackTime = 60000; // 1 minute fallback (shorter for faster testing)
        return runTime > fallbackTime;
      }
      
      return false;
    }
  }

  /**
   * Automatically complete a pickup request when simulation mission is done
   */
  private async autoCompletePickupRequest(requestId: string): Promise<void> {
    try {
      const request = await storage.getPickupRequest(requestId);
      if (!request) {
        console.error(`Pickup request not found: ${requestId}`);
        return;
      }

      if (request.status === "completed") {
        console.log(`Pickup request ${requestId} is already completed`);
        return;
      }

      const weight = parseFloat(request.weight);
      const points = Math.floor(weight * 50);

      // Update pickup request to completed
      const updatedRequest = await storage.updatePickupRequest(requestId, {
        status: "completed",
        completedAt: new Date(),
        pointsAwarded: points,
      });

      // Update user stats and create certificate
      const user = await storage.getUser(request.userId);
      if (user) {
        const newWeight = parseFloat(user.totalWeight) + weight;
        const newPoints = user.ecoPoints + points;

        let level = "Eco Beginner";
        if (newPoints >= 1000) level = "Eco Champion";
        if (newPoints >= 2500) level = "Eco Legend";
        if (newPoints >= 5000) level = "Eco Master";

        await storage.updateUser(request.userId, {
          ecoPoints: newPoints,
          totalWeight: newWeight.toString(),
          level,
        });

        const co2Saved = weight * 0.4;
        await storage.createCertificate({
          userId: request.userId,
          title: "Eco Champion Certificate",
          description: `Congrats! You recycled ${weight}kg and saved ${co2Saved.toFixed(1)}kg CO₂`,
          weight: weight.toString(),
          co2Saved: co2Saved.toString(),
        });

        await storage.createNotification({
          userId: request.userId,
          title: "🎉 Pickup Completed!",
          message: `Your pickup request for ${request.eWasteType} (${request.weight}kg) has been completed successfully by our automated system! You earned ${points} EcoPoints and saved ${co2Saved.toFixed(1)}kg of CO₂ emissions.`,
          type: "success",
          relatedPickupId: request.id,
        });
      }

      // Stop the mission and reset status
      this.stopStatusMonitoring();
      this.missionStatus = {
        isRunning: false,
        requestId: null,
        startTime: null
      };

      // TRIGGER INSTANT FRONTEND UPDATE
      // Emit a completion event that the frontend can listen to
      this.notifyCompletion(requestId, updatedRequest);

      console.log(`Pickup request ${requestId} auto-completed successfully!`);
      
    } catch (error) {
      console.error(`Error auto-completing pickup request ${requestId}:`, error);
    }
  }

  /**
   * Notify about completion - can be extended for WebSocket or other real-time updates
   */
  private notifyCompletion(requestId: string, updatedRequest: any): void {
    // For now, just log it - in the future this could emit WebSocket events
    console.log(`INSTANT UPDATE: Pickup ${requestId} completed - Status: ${updatedRequest.status}`);
    
    // You could emit to a WebSocket here or use other real-time mechanisms
    // For now, the frequent polling will catch this within 1-2 seconds
  }

  /**
   * Force complete the current mission (manual trigger)
   */
  async forceCompleteMission(): Promise<boolean> {
    if (!this.missionStatus.isRunning || !this.missionStatus.requestId) {
      console.log('No active mission to complete');
      return false;
    }

    console.log(`Force completing mission for request: ${this.missionStatus.requestId}`);
    await this.autoCompletePickupRequest(this.missionStatus.requestId);
    return true;
  }

  /**
   * Get simulation statistics
   */
  getSimulationStats() {
    return {
      missionStatus: this.missionStatus,
      serverUrl: this.simulationServerUrl,
      isMonitoring: this.statusCheckInterval !== null
    };
  }
}

// Export singleton instance
export const simulationService = new SimulationService('http://localhost:5002');
export default simulationService;