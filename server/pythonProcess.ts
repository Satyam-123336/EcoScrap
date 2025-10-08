import { spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';
import path from 'path';

const execAsync = promisify(exec);

class PythonModelManager {
  private pythonProcess: ChildProcess | null = null;
  private isStarting = false;
  private isHealthy = false;

  async startPythonModelServer(): Promise<void> {
    if (this.pythonProcess || this.isStarting) {
      console.log('Python model server is already running or starting...');
      return;
    }

    this.isStarting = true;
    console.log('Starting Python model server...');

    try {
      // Check if Python is available
      await this.checkPythonAvailability();

      // Start the Python model server
      const modelServerPath = path.join(process.cwd(), 'model_server.py');
      
      this.pythonProcess = spawn('python', [modelServerPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      });

      // Handle Python process output
      this.pythonProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        console.log(`[Python Model Server] ${output}`);
        
        // Check if server started successfully
        if (output.includes('Starting Flask server') || output.includes('Running on')) {
          console.log('Python model server started successfully!');
          this.isHealthy = true;
        }
      });

      this.pythonProcess.stderr?.on('data', (data) => {
        console.error(`[Python Model Server Error] ${data}`);
      });

      this.pythonProcess.on('close', (code) => {
        console.log(`Python model server exited with code ${code}`);
        this.pythonProcess = null;
        this.isHealthy = false;
      });

      this.pythonProcess.on('error', (error) => {
        console.error('Failed to start Python model server:', error);
        this.pythonProcess = null;
        this.isHealthy = false;
      });

      // Wait for server to be ready
      await this.waitForServerReady();
      
    } catch (error) {
      console.error('Error starting Python model server:', error);
      this.isHealthy = false;
    } finally {
      this.isStarting = false;
    }
  }

  private async checkPythonAvailability(): Promise<void> {
    try {
      const { stdout } = await execAsync('python --version');
      console.log(`Python version: ${stdout.trim()}`);
    } catch (error) {
      // Try python3
      try {
        const { stdout } = await execAsync('python3 --version');
        console.log(`Python version: ${stdout.trim()}`);
      } catch (error2) {
        throw new Error('Python is not available. Please install Python and ensure it\'s in your PATH.');
      }
    }
  }

  private async waitForServerReady(maxAttempts = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch('http://127.0.0.1:5001/health');
        if (response.ok) {
          console.log('Python model server health check passed!');
          return;
        }
      } catch (error) {
        // Server not ready yet
      }
      
      // Wait 1 second before next attempt
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Python model server failed to start within timeout period');
  }

  async stopPythonModelServer(): Promise<void> {
    if (this.pythonProcess) {
      console.log('Stopping Python model server...');
      this.pythonProcess.kill();
      this.pythonProcess = null;
      this.isHealthy = false;
    }
  }

  isServerHealthy(): boolean {
    return this.isHealthy && this.pythonProcess !== null;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch('http://127.0.0.1:5001/health');
      this.isHealthy = response.ok;
      return this.isHealthy;
    } catch (error) {
      this.isHealthy = false;
      return false;
    }
  }
}

export const pythonModelManager = new PythonModelManager();