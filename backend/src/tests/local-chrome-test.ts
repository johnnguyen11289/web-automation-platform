import { AutomationService } from '../services/automation.service';
import { BrowserProfile } from '../types/browser.types';
import { Types } from 'mongoose';
import path from 'path';
import os from 'os';

async function testLocalChrome() {
  try {
    const automationService = AutomationService.getInstance();

    // Create a test profile with local Chrome enabled
    const testProfile: BrowserProfile = {
      _id: new Types.ObjectId(),
      name: 'Local Chrome Test',
      browserType: 'chromium',
      useLocalChrome: true,
      userDataDir: process.platform === 'win32'
        ? path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\User Data')
        : process.platform === 'darwin'
          ? path.join(os.homedir(), 'Library/Application Support/Google/Chrome')
          : path.join(os.homedir(), '.config/google-chrome'),
      isHeadless: false,
      viewport: {
        width: 1920,
        height: 1080
      },
      cookies: [],
      localStorage: {},
      sessionStorage: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Applying profile with local Chrome...');
    await automationService.applyProfile(testProfile);

    console.log('Testing navigation...');
    const result = await automationService.performWebAutomation('https://www.google.com', [
      {
        type: 'wait',
        condition: 'networkIdle'
      },
      {
        type: 'screenshot',
        value: 'local-chrome-test.png'
      }
    ]);

    console.log('Test result:', result.success ? 'Success' : 'Failed');
    
    // Wait for a few seconds to see the browser
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Cleanup
    await automationService.close();
    console.log('Test completed');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testLocalChrome(); 