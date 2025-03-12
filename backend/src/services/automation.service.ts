import { chromium, firefox, webkit, Browser, Page, BrowserContext } from 'playwright';
import { BrowserProfile } from '../types/browser.types';
import * as path from 'path';
import * as os from 'os';

export class AutomationService {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private currentProfile: BrowserProfile | null = null;
  private currentPage: Page | null = null;
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
    try {
      if (this.currentPage && !this.currentPage.isClosed()) {
        await this.currentPage.close().catch(() => {});
      }
      this.currentPage = null;

      if (this.context) {
        // Safely close all pages first
        const pages = this.context.pages();
        for (const page of pages) {
          if (!page.isClosed()) {
            await page.close().catch(() => {});
          }
        }
        await this.context.close().catch(() => {});
      }
      this.context = null;

      if (this.browser) {
        await this.browser.close().catch(() => {});
      }
      this.browser = null;
    } catch (error) {
      console.log('Error during cleanup, but continuing:', error);
    }
    this.currentProfile = null;
  }

  async applyProfile(profile: BrowserProfile) {
    try {
      console.log('Applying browser profile:', {
        name: profile.name,
        id: profile._id,
        browserType: profile.browserType,
        isHeadless: profile.isHeadless,
        userAgent: profile.userAgent?.substring(0, 50) + '...',
        hasProxy: !!profile.proxy,
        viewport: profile.viewport
      });

      // Check if we can reuse both browser and context
      const canReuseContext = this.context && 
        this.currentProfile?.browserType === profile.browserType &&
        this.currentProfile?.isHeadless === profile.isHeadless &&
        this.currentProfile?.viewport?.width === profile.viewport?.width &&
        this.currentProfile?.viewport?.height === profile.viewport?.height &&
        this.currentProfile?.userAgent === profile.userAgent &&
        JSON.stringify(this.currentProfile?.proxy) === JSON.stringify(profile.proxy);

      // Only close if we can't reuse
      if (!canReuseContext) {
        console.log('Creating new browser context for profile:', profile.name);
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
        const installPath = 'C:\\Users\\John\\AppData\\Local\\ms-playwright';
        const executablePath = process.platform === 'win32' 
          ? path.join(installPath, 'chromium-1161', 'chrome-win', 'chrome.exe')
          : undefined;

        // Create persistent user data directory for this profile
        const userDataDir = path.join(installPath, 'user-data-dirs', `profile-${profile._id}`);
        
        // Ensure the directory exists
        if (!require('fs').existsSync(userDataDir)) {
          require('fs').mkdirSync(userDataDir, { recursive: true });
        }

        // Create context options with additional settings to appear more like regular Chrome
        const contextOptions: any = {
          viewport: profile.viewport || null,
          userAgent: profile.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          headless: false,
          args: [
            '--start-maximized',
            '--disable-blink-features=AutomationControlled',
            '--window-size=1920,1080'
          ],
          ignoreDefaultArgs: ['--enable-automation', '--enable-blink-features=AutomationControlled'],
          executablePath: executablePath
        };

        // Add proxy if configured
        if (profile.proxy?.host && profile.proxy?.port) {
          const proxyProtocol = profile.proxy.host.startsWith('http://') || profile.proxy.host.startsWith('https://') 
            ? '' 
            : 'http://';
          const proxyHost = profile.proxy.host.replace(/^https?:\/\//, '');
          const proxyUrl = `${proxyProtocol}${proxyHost}:${profile.proxy.port}`;

          console.log('Configuring proxy for profile:', {
            profileName: profile.name,
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

        // Launch persistent context
        this.context = await browserType.launchPersistentContext(userDataDir, contextOptions);
        console.log('Browser context created successfully for profile:', profile.name);

        // Set cookies if any
        if (profile.cookies?.length) {
          console.log('Setting cookies for profile:', {
            profileName: profile.name,
            cookieCount: profile.cookies.length
          });
          await this.context.addCookies(profile.cookies);
          console.log('Cookies set successfully for profile:', profile.name);
        }

        // Execute startup script if any
        if (profile.startupScript) {
          console.log('Executing startup script for profile:', profile.name);
          const page = await this.context.newPage();
          await page.evaluate(profile.startupScript);
          await page.close();
          console.log('Startup script executed successfully for profile:', profile.name);
        }
      } else {
        console.log('Reusing existing browser context for profile:', profile.name);
      }

      this.currentProfile = profile;
      console.log('Profile applied successfully:', profile.name);
    } catch (error) {
      console.error('Failed to apply profile:', {
        name: profile.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Clean up resources in case of error
      await this.close();
      throw new Error('Failed to apply profile: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  private async getPage(): Promise<Page> {
    if (!this.context) {
      throw new Error('Browser context not initialized. Did you call applyProfile?');
    }
    if (!this.currentPage || this.currentPage.isClosed()) {
      console.log('Creating new page...');
      this.currentPage = await this.context.newPage();
    } else {
      console.log('Reusing existing page');
    }
    return this.currentPage;
  }

  async performWebAutomation(url: string | null, actions: AutomationAction[]): Promise<AutomationResult> {
    const page = await this.getPage();
    const results: AutomationStepResult[] = [];
    let success = true;
    let extractedData: Record<string, any> = {};

    try {
      // Only navigate if we have a real URL (not null or about:blank)
      if (url && url !== 'about:blank' && (!actions[0] || actions[0].type !== 'openUrl')) {
        console.log('Navigating to initial URL:', url);
        await page.goto(url);
      }

      for (const action of actions) {
        try {
          console.log('Performing action:', action.type);
          switch (action.type) {
            case 'openUrl':
              if (!action.value) {
                throw new Error('URL is required for openUrl action');
              }
              console.log('Navigating to URL:', action.value);
              await page.goto(action.value, {
                waitUntil: action.waitUntil || 'load',
                timeout: action.timeout
              });
              break;

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
    } catch (error) {
      success = false;
      throw error;
    } finally {
      // Don't close the page here anymore since we're reusing it
      return { success, results, extractedData };
    }
  }

  async openProfileForSetup(profile: BrowserProfile): Promise<void> {
    try {
      console.log('Opening profile for manual setup:', profile.name);
      
      // Initialize if needed
      if (!AutomationService.browsersInstalled) {
        await this.init();
      }

      // Close any existing browser instance
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

      // Set up paths
      const installPath = 'C:\\Users\\John\\AppData\\Local\\ms-playwright';
      const executablePath = process.platform === 'win32' 
        ? path.join(installPath, 'chromium-1161', 'chrome-win', 'chrome.exe')
        : undefined;

      // Create persistent user data directory for this profile
      const userDataDir = path.join(installPath, 'user-data-dirs', `profile-${profile._id}`);
      
      // Ensure the directory exists
      if (!require('fs').existsSync(userDataDir)) {
        require('fs').mkdirSync(userDataDir, { recursive: true });
      }

      console.log('Opening browser for manual setup:', {
        name: profile.name,
        userDataDir: userDataDir
      });

      // Create context options with additional settings to appear more like regular Chrome
      const contextOptions: any = {
        viewport: profile.viewport || null,
        userAgent: profile.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        headless: false,
        args: [
          '--start-maximized',
          '--disable-blink-features=AutomationControlled',
          '--window-size=1920,1080'
        ],
        ignoreDefaultArgs: ['--enable-automation', '--enable-blink-features=AutomationControlled'],
        executablePath: executablePath
      };

      // Add proxy if configured
      if (profile.proxy?.host && profile.proxy?.port) {
        const proxyProtocol = profile.proxy.host.startsWith('http://') || profile.proxy.host.startsWith('https://') 
          ? '' 
          : 'http://';
        const proxyHost = profile.proxy.host.replace(/^https?:\/\//, '');
        const proxyUrl = `${proxyProtocol}${proxyHost}:${profile.proxy.port}`;

        contextOptions.proxy = {
          server: proxyUrl,
          ...(profile.proxy.username && { username: profile.proxy.username }),
          ...(profile.proxy.password && { password: profile.proxy.password })
        };
      }

      // Launch persistent context with modified options
      this.context = await browserType.launchPersistentContext(userDataDir, contextOptions);
      
      // Safely close any existing pages/tabs
      try {
        const pages = this.context.pages();
        for (const page of pages) {
          if (!page.isClosed()) {
            await page.close().catch(() => {});
          }
        }
      } catch (error) {
        console.log('Error closing existing pages, but continuing:', error);
      }
      
      // Open a new page with common login URLs based on profile name
      const page = await this.context.newPage();
      this.currentPage = page;

      // Suggest common login pages based on profile name
      const lowerProfileName = profile.name.toLowerCase();
      let loginUrl = 'about:blank';
      if (lowerProfileName.includes('google')) {
        loginUrl = 'https://accounts.google.com';
      } else if (lowerProfileName.includes('facebook')) {
        loginUrl = 'https://www.facebook.com';
      } else if (lowerProfileName.includes('twitter')) {
        loginUrl = 'https://twitter.com/login';
      } else if (lowerProfileName.includes('linkedin')) {
        loginUrl = 'https://www.linkedin.com/login';
      }

      await page.goto(loginUrl);
      
      console.log('Profile opened for manual setup. Please perform any necessary logins or configurations.');
      console.log('The browser will remain open until you close it or call closeProfileSetup().');
      
      // Store current profile
      this.currentProfile = profile;

    } catch (error) {
      console.error('Failed to open profile for setup:', {
        name: profile.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      await this.close();
      throw error;
    }
  }

  async closeProfileSetup(): Promise<void> {
    console.log('Closing profile setup...');
    await this.close();
    console.log('Profile setup closed. Your login sessions and configurations have been saved.');
  }
}

export interface AutomationAction {
  type: 'click' | 'type' | 'screenshot' | 'wait' | 'extract' | 'evaluate' | 'keyboard' | 'select' | 'focus' | 'hover' | 'openUrl';
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
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
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