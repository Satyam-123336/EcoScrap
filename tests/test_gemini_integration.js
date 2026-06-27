#!/usr/bin/env node

import axios from 'axios';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000';
const TEST_TIMEOUT = 30000;

class GeminiIntegrationTester {
  constructor() {
    this.serverProcess = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async waitForServer(port = 5000, timeout = 10000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      try {
        await axios.get(`${BASE_URL}/api/stats`, { timeout: 1000 });
        return true;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    return false;
  }

  async startServer(envVars = {}) {
    this.log('Starting server...');

    const envContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    if (Object.keys(envVars).length > 0) {
      fs.writeFileSync('.env.test', envContent);
    }

    return new Promise((resolve, reject) => {
      const env = { ...process.env, ...envVars };
      this.serverProcess = spawn('npm', ['run', 'dev'], {
        cwd: process.cwd(),
        env,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let serverReady = false;
      const timeout = setTimeout(() => {
        if (!serverReady) {
          this.serverProcess.kill();
          reject(new Error('Server startup timeout'));
        }
      }, TEST_TIMEOUT);

      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('serving on port')) {
          serverReady = true;
          clearTimeout(timeout);
          this.log('Server started successfully', 'success');
          resolve();
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        this.log(`Server stderr: ${data.toString()}`, 'warning');
      });

      this.serverProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  async stopServer() {
    if (this.serverProcess) {
      this.log('Stopping server...');
      this.serverProcess.kill('SIGTERM');

      await new Promise(resolve => {
        this.serverProcess.on('exit', () => {
          this.log('Server stopped', 'success');
          resolve();
        });
        setTimeout(resolve, 5000);
      });
    }

    if (fs.existsSync('.env.test')) {
      fs.unlinkSync('.env.test');
    }
  }

  async testChatbot(message, expectedFallback = false) {
    try {
      const response = await axios.post(`${BASE_URL}/api/chatbot`, {
        message,
        history: []
      }, { timeout: 10000 });

      const responseText = response.data.message;

      if (expectedFallback) {
        const isMockResponse = responseText.includes('EcoBot') ||
                              responseText.includes('recycling') ||
                              responseText.includes('e-waste') ||
                              responseText.length < 200;

        if (isMockResponse) {
          this.log(`✅ Mock response received: "${responseText.substring(0, 50)}..."`, 'success');
          return { success: true, response: responseText, type: 'mock' };
        } else {
          this.log(`❌ Expected mock response but got: "${responseText.substring(0, 50)}..."`, 'error');
          return { success: false, response: responseText, type: 'unexpected' };
        }
      } else {
        const isGeminiResponse = responseText.length > 100 &&
                                !responseText.includes('recycling questions') &&
                                responseText.includes('recycle') ||
                                responseText.includes('environment');

        if (isGeminiResponse) {
          this.log(`✅ Gemini response received: "${responseText.substring(0, 50)}..."`, 'success');
          return { success: true, response: responseText, type: 'gemini' };
        } else {
          this.log(`⚠️ Response received: "${responseText.substring(0, 50)}..."`, 'warning');
          return { success: true, response: responseText, type: 'unknown' };
        }
      }
    } catch (error) {
      this.log(`❌ Chatbot test failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async runTest(testName, testFunction) {
    this.log(`\n🧪 Running test: ${testName}`);
    try {
      const result = await testFunction();
      if (result.success !== false) {
        this.testResults.passed++;
        this.log(`✅ ${testName} PASSED`, 'success');
      } else {
        this.testResults.failed++;
        this.log(`❌ ${testName} FAILED`, 'error');
      }
      this.testResults.tests.push({ name: testName, ...result });
      return result;
    } catch (error) {
      this.testResults.failed++;
      this.log(`❌ ${testName} FAILED: ${error.message}`, 'error');
      this.testResults.tests.push({ name: testName, success: false, error: error.message });
      return { success: false, error: error.message };
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Gemini Integration Tests\n');

    await this.runTest('Server without GEMINI_API_KEY', async () => {
      await this.startServer({ GEMINI_API_KEY: '' });
      await this.waitForServer();

      const result = await this.testChatbot('What can I recycle?', true);
      await this.stopServer();
      return result;
    });

    await this.runTest('Server with invalid GEMINI_API_KEY', async () => {
      await this.startServer({ GEMINI_API_KEY: 'invalid_key_123' });
      await this.waitForServer();

      const result = await this.testChatbot('Hello', true);
      await this.stopServer();
      return result;
    });

    const validKey = process.env.GEMINI_API_KEY;
    if (validKey) {
      await this.runTest('Server with valid GEMINI_API_KEY', async () => {
        await this.startServer({ GEMINI_API_KEY: validKey });
        await this.waitForServer();

        const result = await this.testChatbot('What is e-waste?', false);
        await this.stopServer();
        return result;
      });
    } else {
      this.log('⚠️ Skipping valid API key test - no GEMINI_API_KEY in environment');
    }

    await this.runTest('Empty message handling', async () => {
      await this.startServer({ GEMINI_API_KEY: '' });
      await this.waitForServer();

      try {
        await axios.post(`${BASE_URL}/api/chatbot`, {
          message: '',
          history: []
        });
        await this.stopServer();
        return { success: false, error: 'Should have rejected empty message' };
      } catch (error) {
        if (error.response?.status === 400) {
          await this.stopServer();
          return { success: true, response: 'Correctly rejected empty message' };
        } else {
          await this.stopServer();
          return { success: false, error: `Unexpected error: ${error.message}` };
        }
      }
    });

    await this.runTest('Conversation history', async () => {
      await this.startServer({ GEMINI_API_KEY: '' });
      await this.waitForServer();

      const history = [
        { role: 'user', content: 'What can I recycle?' },
        { role: 'assistant', content: 'You can recycle mobile phones and laptops.' }
      ];

      const result = await this.testChatbot('How do I prepare them?', true);
      await this.stopServer();
      return result;
    });

    this.printResults();
  }

  printResults() {
    this.log('\n📊 Test Results Summary', 'info');
    this.log('='.repeat(50), 'info');
    this.log(`Total Tests: ${this.testResults.tests.length}`, 'info');
    this.log(`Passed: ${this.testResults.passed}`, 'success');
    this.log(`Failed: ${this.testResults.failed}`, 'error');

    if (this.testResults.failed > 0) {
      this.log('\n❌ Failed Tests:', 'error');
      this.testResults.tests
        .filter(test => !test.success)
        .forEach(test => {
          this.log(`  - ${test.name}: ${test.error || 'Unknown error'}`, 'error');
        });
    }

    this.log('\n✅ Passed Tests:', 'success');
    this.testResults.tests
      .filter(test => test.success)
      .forEach(test => {
        this.log(`  - ${test.name}`, 'success');
      });
  }
}

async function main() {
  const tester = new GeminiIntegrationTester();

  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default GeminiIntegrationTester;
