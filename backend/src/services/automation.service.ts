import { chromium, firefox, webkit, Browser, Page, BrowserContext } from 'playwright';
import { BrowserProfile } from '../types/browser.types';
import * as path from 'path';
import * as os from 'os';

export class AutomationService {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private currentProfile: BrowserProfile | null = null;
  private static browsersInstalled = false;
  private static instance: AutomationService | null = null;

  // Singleton pattern to ensure single instance
  public static getInstance(): AutomationService {
    if (!AutomationService.instance) {
      AutomationService.instance = new AutomationService();
    }
    return AutomationService.instance;
  }

  // Private constructor to enforce singleton
  private constructor() {
    // Handle process termination
    process.on('SIGTERM', () => this.cleanup());
    process.on('SIGINT', () => this.cleanup());
    process.on('exit', () => this.cleanup());
  }

  private async cleanup() {
    console.log('Cleaning up browser resources...');
    await this.close();
    AutomationService.browsersInstalled = false;
    AutomationService.instance = null;
  }

  async init() {
    try {
      // Check if browser is already installed in the correct location
      const installPath = 'C:\\Users\\John\\AppData\\Local\\ms-playwright';
      const chromePath = path.join(installPath, 'chromium-1161', 'chrome-win', 'chrome.exe');
      
      const isChromiumInstalled = (() => {
        try {
          return require('fs').existsSync(chromePath);
        } catch (e) {
          return false;
        }
      })();

      if (!isChromiumInstalled) {
        console.log('Browser not found, installing browser binaries...');
        const { execSync } = require('child_process');
        
        // Force the Windows installation path
        process.env.PLAYWRIGHT_BROWSERS_PATH = installPath;
        
        console.log('Installing browsers to:', installPath);
        
        // Only install if not already present
        execSync('npx playwright install chromium', { stdio: 'inherit' });
        console.log('Browser binaries installed successfully');
      } else {
        console.log('Using existing browser installation at:', chromePath);
        process.env.PLAYWRIGHT_BROWSERS_PATH = installPath;
      }

      AutomationService.browsersInstalled = true;

      // Browser will be initialized when profile is applied
      this.browser = null;
      this.context = null;
    } catch (error) {
      console.error('Failed to initialize automation service:', error);
      throw new Error('Failed to initialize automation service: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async close() {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    this.currentProfile = null;
  }

  async applyProfile(profile: BrowserProfile) {
    try {
      // Check if we can reuse the existing browser and context
      const canReuseBrowser = this.browser && 
        this.currentProfile?.browserType === profile.browserType &&
        this.currentProfile?.isHeadless === profile.isHeadless;

      // Only close if we can't reuse
      if (!canReuseBrowser) {
        console.log('Creating new browser instance...');
        await this.close();

        // Select browser type
        const browserType = {
          chromium: chromium,
          firefox: firefox,
          webkit: webkit
        }[profile.browserType];

        if (!browserType) {
          throw new Error(`Unsupported browser type: ${profile.browserType}`);
        }

        // Set executable path for Windows
        const executablePath = process.platform === 'win32' 
          ? 'C:\\Users\\John\\AppData\\Local\\ms-playwright\\chromium-1161\\chrome-win\\chrome.exe'
          : undefined;

        // Launch browser with profile settings
        console.log('Launching browser with profile:', {
          type: profile.browserType,
          headless: profile.isHeadless
        });

        this.browser = await browserType.launch({
          headless: profile.isHeadless,
          executablePath: executablePath,
          args: ['--start-maximized'] // Add this to ensure window is visible
        });
        console.log('Browser launched successfully');
      } else {
        console.log('Reusing existing browser instance');
      }

      // Always create a new context with the updated profile settings
      if (this.context) {
        await this.context.close();
        this.context = null;
      }

      // Create context with profile settings
      console.log('Creating browser context...');
      const contextOptions: any = {
        viewport: profile.viewport || null, // Set to null for maximized window
        userAgent: profile.userAgent
      };

      // Add proxy if both host and port are provided
      if (profile.proxy?.host && profile.proxy?.port) {
        // Format proxy URL with protocol
        const proxyProtocol = profile.proxy.host.startsWith('http://') || profile.proxy.host.startsWith('https://') 
          ? '' 
          : 'http://';
        const proxyHost = profile.proxy.host.replace(/^https?:\/\//, ''); // Remove protocol if exists
        const proxyUrl = `${proxyProtocol}${proxyHost}:${profile.proxy.port}`;

        console.log('Configuring proxy:', {
          server: proxyUrl,
          hasUsername: !!profile.proxy.username,
          hasPassword: !!profile.proxy.password
        });

        contextOptions.proxy = {
          server: proxyUrl,
          ...(profile.proxy.username && { username: profile.proxy.username }),
          ...(profile.proxy.password && { password: profile.proxy.password })
        };
      }

      if (!this.browser) {
        throw new Error('Browser not initialized');
      }

      this.context = await this.browser.newContext(contextOptions);
      console.log('Browser context created successfully');

      // Set cookies if any
      if (profile.cookies?.length) {
        console.log('Setting cookies...');
        await this.context.addCookies(profile.cookies);
        console.log('Cookies set successfully');
      }

      // Execute startup script if any
      if (profile.startupScript) {
        console.log('Executing startup script...');
        const page = await this.context.newPage();
        await page.evaluate(profile.startupScript);
        await page.close();
        console.log('Startup script executed successfully');
      }

      this.currentProfile = profile;
      console.log('Profile applied successfully');
    } catch (error) {
      console.error('Failed to apply profile:', error);
      // Clean up resources in case of error
      await this.close();
      throw new Error('Failed to apply profile: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  private async getPage(): Promise<Page> {
    if (!this.context) {
      throw new Error('Browser context not initialized. Did you call applyProfile?');
    }
    return await this.context.newPage();
  }

  async performWebAutomation(url: string, actions: AutomationAction[]): Promise<AutomationResult> {
    const page = await this.getPage();
    const results: AutomationStepResult[] = [];
    let success = true;
    let extractedData: Record<string, any> = {};

    try {
      await page.goto(url);

      for (const action of actions) {
        try {
          switch (action.type) {
            case 'click':
              if (!action.selector) {
                throw new Error('Selector is required for click action');
              }
              await page.click(action.selector, {
                button: action.button || 'left',
                clickCount: action.clickCount || 1,
                delay: action.delay
              });
              break;

            case 'type':
              if (!action.selector) {
                throw new Error('Selector is required for type action');
              }
              if (action.clearFirst) {
                await page.click(action.selector, { clickCount: 3 });
                await page.keyboard.press('Backspace');
              }
              await page.fill(action.selector, action.value || '');
              break;

            case 'screenshot':
              const screenshotPath = action.value || `screenshot-${Date.now()}.png`;
              await page.screenshot({ path: screenshotPath });
              break;

            case 'wait':
              if (action.condition === 'networkIdle') {
                await page.waitForLoadState('networkidle');
              } else if (action.condition === 'delay' && action.delay) {
                await page.waitForTimeout(action.delay);
              } else if (action.selector) {
                await page.waitForSelector(action.selector, {
                  timeout: action.timeout
                });
              } else {
                throw new Error('Invalid wait action configuration');
              }
              break;

            case 'extract':
              if (!action.selector) {
                throw new Error('Selector is required for extract action');
              }
              let extractedValue: string | null = null;
              if (action.attribute === 'text') {
                extractedValue = await page.textContent(action.selector);
              } else if (action.attribute) {
                extractedValue = await page.getAttribute(action.selector, action.attribute);
              } else {
                extractedValue = await page.textContent(action.selector);
              }
              if (action.key) {
                extractedData[action.key] = extractedValue;
              }
              break;

            case 'evaluate':
              if (!action.script) {
                throw new Error('Script is required for evaluate action');
              }
              const result = await page.evaluate(action.script);
              if (action.key) {
                extractedData[action.key] = result;
              }
              break;

            case 'keyboard':
              if (!action.key) {
                throw new Error('Key is required for keyboard action');
              }
              await page.keyboard.press(action.key);
              break;

            case 'select':
              if (!action.selector || !action.value) {
                throw new Error('Selector and value are required for select action');
              }
              await page.selectOption(action.selector, action.value);
              break;

            case 'focus':
              if (!action.selector) {
                throw new Error('Selector is required for focus action');
              }
              await page.focus(action.selector);
              break;

            case 'hover':
              if (!action.selector) {
                throw new Error('Selector is required for hover action');
              }
              await page.hover(action.selector);
              break;
          }
          results.push({ action, success: true });
        } catch (error) {
          success = false;
          results.push({
            action,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          if (action.stopOnError !== false) {
            throw error;
          }
        }
      }

      return { success, results, extractedData };
    } finally {
      await page.close();
    }
  }
}

export interface AutomationAction {
  type: 'click' | 'type' | 'screenshot' | 'wait' | 'extract' | 'evaluate' | 'keyboard' | 'select' | 'focus' | 'hover';
  selector?: string;
  value?: string;
  key?: string;
  script?: string;
  button?: 'left' | 'right' | 'middle';
  clickCount?: number;
  delay?: number;
  timeout?: number;
  condition?: 'networkIdle' | 'delay';
  attribute?: string;
  clearFirst?: boolean;
  stopOnError?: boolean;
}

export interface AutomationStepResult {
  action: AutomationAction;
  success: boolean;
  error?: string;
}

export interface AutomationResult {
  success: boolean;
  results: AutomationStepResult[];
  extractedData: Record<string, any>;
} 