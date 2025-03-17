import puppeteer, { Browser, Page, PuppeteerLifeCycleEvent, Permission, KeyInput, LaunchOptions, ElementHandle } from 'puppeteer';
import { IBrowserAutomation } from '../interfaces/browser-automation.interface';
import { BrowserProfile } from '../types/browser.types';
import { AutomationAction, AutomationResult, AutomationStepResult } from '../types/automation.types';
import { BrowserFingerprintService } from './browser-fingerprint.service';
import { HumanBehaviorService } from './human-behavior.service';
import { WebsiteEvasionsService } from './website-evasions.service';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

export class PuppeteerAutomationService implements IBrowserAutomation {
  private browser: Browser | null = null;
  private currentProfile: BrowserProfile | null = null;
  private currentPage: Page | null = null;
  private static instance: PuppeteerAutomationService | null = null;
  private fingerprintService: BrowserFingerprintService;
  private humanBehaviorService: HumanBehaviorService;
  private websiteEvasionsService: WebsiteEvasionsService;
  private logger: (message: string) => void;

  public static getInstance(): PuppeteerAutomationService {
    if (!PuppeteerAutomationService.instance) {
      PuppeteerAutomationService.instance = new PuppeteerAutomationService();
    }
    return PuppeteerAutomationService.instance;
  }

  private constructor() {
    this.fingerprintService = BrowserFingerprintService.getInstance();
    this.humanBehaviorService = HumanBehaviorService.getInstance();
    this.websiteEvasionsService = WebsiteEvasionsService.getInstance();
    this.logger = (message: string) => {
      const timestamp = new Date().toISOString();
      process.stdout.write(`[${timestamp}] [PuppeteerAutomation] ${message}\n`);
    };
    
    process.on('SIGTERM', () => this.cleanup());
    process.on('SIGINT', () => this.cleanup());
    process.on('exit', () => this.cleanup());
  }

  public setProfile(profile: BrowserProfile): void {
    this.currentProfile = profile;
    this.logger('Profile set successfully');
  }

  private async cleanup() {
    await this.close();
    PuppeteerAutomationService.instance = null;
  }

  private getChromePath(): string {
    const platform = os.platform();
    const homeDir = os.homedir();

    switch (platform) {
      case 'win32':
        const possiblePaths = [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          path.join(homeDir, 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe')
        ];
        
        for (const path of possiblePaths) {
          if (fs.existsSync(path)) {
            return path;
          }
        }
        break;

      case 'darwin':
        const macPath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        if (fs.existsSync(macPath)) {
          return macPath;
        }
        break;

      case 'linux':
        const linuxPaths = [
          '/usr/bin/google-chrome',
          '/usr/bin/google-chrome-stable',
          '/usr/bin/chromium-browser',
          '/usr/bin/chromium'
        ];
        
        for (const path of linuxPaths) {
          if (fs.existsSync(path)) {
            return path;
          }
        }
        break;
    }

    // If no Chrome installation found, return default path
    return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  }

  public async initialize(): Promise<void> {
    if (!this.browser) {
      this.logger('Initializing browser');
      const userDataDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
      const profilePath = this.currentProfile?.name ? path.join(userDataDir, this.currentProfile.name) : undefined;

      // Get viewport settings from profile or use defaults
      const viewportWidth = this.currentProfile?.viewport?.width || 1920;
      const viewportHeight = this.currentProfile?.viewport?.height || 1080;
      this.logger(`Setting viewport: ${viewportWidth}x${viewportHeight}`);
      const options: LaunchOptions = {
        headless: this.currentProfile?.isHeadless || false,
        executablePath: this.getChromePath(),
        userDataDir: userDataDir,
        args: [
          `--profile-directory=${this.currentProfile?.name || 'Default'}`,
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--start-maximized',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-infobars',
          '--window-position=0,0',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-breakpad',
          '--disable-component-extensions-with-background-pages',
          '--disable-extensions',
          '--disable-features=TranslateUI,BlinkGenPropertyTrees',
          '--disable-ipc-flooding-protection',
          '--disable-renderer-backgrounding',
          '--enable-features=NetworkService,NetworkServiceInProcess',
          '--force-color-profile=srgb',
          '--metrics-recording-only',
          // '--remote-debugging-port=9222',
          // Add these flags for DPI handling
          '--high-dpi-support=1',
          // '--force-device-scale-factor=1',
          // Force Windows to use system DPI settings
          '--enable-use-zoom-for-dsf=false',
          '--disable-gpu-vsync',
          `--window-size=${viewportWidth},${viewportHeight}`,
          // Force Windows scaling
          process.platform === 'win32' ? '--force-windows-scaling' : ''
        ].filter(Boolean),
        defaultViewport: {
          width: viewportWidth,
          height: viewportHeight,
          deviceScaleFactor: 1,
          isMobile: false,
          hasTouch: false,
          isLandscape: true
        },
        ignoreDefaultArgs: ['--enable-automation'],
        protocolTimeout: 30000,
        pipe: true
      };

      this.browser = await puppeteer.launch(options);
      
      // Get existing pages
      const pages = await this.browser.pages();
      // Use existing page if available, otherwise create new one
      this.currentPage = pages.length > 0 ? pages[0] : await this.browser.newPage();

      // Set up CDP session for DPI handling
      const client = await this.currentPage.target().createCDPSession();
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: viewportWidth,
        height: viewportHeight,
        deviceScaleFactor: 1,
        mobile: false
      });

      // Apply anti-detection measures using CDP
      await this.currentPage.evaluateOnNewDocument(() => {
        // Override the navigator.webdriver property
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined
        });

        // Override the chrome property
        (window as any).chrome = {
          runtime: {},
        };

        // Override navigator permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters: any): Promise<any> => 
          parameters.name === 'notifications' 
            ? Promise.resolve({ state: Notification.permission }) 
            : originalQuery.call(window.navigator.permissions, parameters);

        // Add language and plugins
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en']
        });

        Object.defineProperty(navigator, 'plugins', {
          get: () => [
            {
              0: {
                type: 'application/x-google-chrome-pdf',
                suffixes: 'pdf',
                description: 'Portable Document Format',
                enabledPlugin: true
              },
              description: 'Chrome PDF Plugin',
              filename: 'internal-pdf-viewer',
              length: 1,
              name: 'Chrome PDF Plugin'
            }
          ]
        });
      });

      // Set a more realistic user agent if not provided by profile
      if (!this.currentProfile?.userAgent) {
        await this.currentPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      }
      
      // Remove fixed viewport to allow responsive behavior
      await this.currentPage.setViewport({
        width: 0,
        height: 0,
        deviceScaleFactor: 1
      });
    }
  }

  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    this.currentPage = null;
  }

  public async getPage(): Promise<Page> {
    if (!this.currentPage) {
      throw new Error('No active page. Call initialize() first.');
    }
    return this.currentPage;
  }

  public async goto(url: string, options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'networkidle0', timeout?: number }): Promise<void> {
    const page = await this.getPage();
    try {
      await page.goto(url, {
        waitUntil: (options?.waitUntil === 'networkidle' ? 'networkidle0' : options?.waitUntil) as PuppeteerLifeCycleEvent,
        timeout: options?.timeout
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('net::ERR_CERT_')) {
        // Handle certificate errors by continuing anyway
        await page.goto(url, {
          waitUntil: (options?.waitUntil === 'networkidle' ? 'networkidle0' : options?.waitUntil) as PuppeteerLifeCycleEvent,
          timeout: options?.timeout
        });
      } else {
        throw error;
      }
    }
  }

  public async click(selector: string, options?: { button?: 'left' | 'right' | 'middle', clickCount?: number, delay?: number }): Promise<void> {
    const page = await this.getPage();
    await page.click(selector, {
      button: options?.button || 'left',
      clickCount: options?.clickCount || 1,
      delay: options?.delay || Math.floor(Math.random() * 100) + 50
    });
  }

  public async type(selector: string, text: string, options?: { delay?: number }): Promise<void> {
    const page = await this.getPage();
    await page.type(selector, text, { delay: options?.delay });
  }

  public async select(selector: string, value: string): Promise<void> {
    const page = await this.getPage();
    await page.select(selector, value);
  }

  public async focus(selector: string): Promise<void> {
    const page = await this.getPage();
    await page.focus(selector);
  }

  public async hover(selector: string): Promise<void> {
    const page = await this.getPage();
    await page.hover(selector);
  }

  public async waitForSelector(selector: string, options?: { timeout?: number }): Promise<void> {
    const page = await this.getPage();
    await page.waitForSelector(selector, { timeout: options?.timeout });
  }

  public async waitForLoadState(state: 'load' | 'domcontentloaded' | 'networkidle'): Promise<void> {
    const page = await this.getPage();
    switch (state) {
      case 'load':
        await page.waitForNavigation({ waitUntil: 'load' });
        break;
      case 'domcontentloaded':
        await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
        break;
      case 'networkidle':
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        break;
    }
  }

  public async waitForTimeout(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  public async evaluate(script: string): Promise<any> {
    const page = await this.getPage();
    return page.evaluate(script);
  }

  public async screenshot(options?: { path?: string }): Promise<Buffer> {
    const page = await this.getPage();
    const screenshot = await page.screenshot(options);
    return Buffer.from(screenshot);
  }

  public async pickFile(filePath: string, options?: { fileName?: string, multiple?: boolean, directory?: boolean, accept?: string }): Promise<{ paths: string | string[], variableKey?: string }> {
    const fs = require('fs');
    const path = require('path');

    if (!fs.existsSync(filePath)) {
      throw new Error(`Directory not found: ${filePath}`);
    }

    const files = fs.readdirSync(filePath);
    let variableKey: string | undefined;
    
    let matchingFiles = files.filter((file: string) => {
      const fullPath = path.join(filePath, file);
      const isDirectory = fs.statSync(fullPath).isDirectory();
      
      if (options?.directory && !isDirectory) return false;
      if (!options?.directory && isDirectory) return false;
      
      if (options?.fileName) {
        // Extract variable name if fileName is a pure variable pattern
        const variableMatch = options.fileName.match(/^\{(\w+)\}$/);
        if (variableMatch) {
          variableKey = variableMatch[1];
          return true; // Match any file if it's a pure variable
        }

        // For exact match with Chinese characters, use direct comparison
        if (file === options.fileName) {
          return true;
        }
        // For pattern matching, escape special regex characters
        const escapedPattern = options.fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
        const pattern = new RegExp(escapedPattern);
        if (!pattern.test(file)) return false;
      }
      
      if (options?.accept && !isDirectory) {
        const extensions = options.accept.split(',').map(ext => ext.trim());
        const fileExt = path.extname(file).toLowerCase();
        if (!extensions.some(ext => fileExt.endsWith(ext))) return false;
      }
      
      return true;
    });

    matchingFiles.sort();

    if (!options?.multiple && matchingFiles.length > 0) {
      matchingFiles = [matchingFiles[0]];
    }

    const fullPaths = matchingFiles.map((file: string) => path.join(filePath, file));
    return {
      paths: options?.multiple ? fullPaths : fullPaths[0] || '',
      variableKey
    };
  }

  public async openProfileForSetup(profile: BrowserProfile): Promise<void> {
    const page = await this.getPage();
    
    // Apply additional anti-detection measures
    await page.evaluateOnNewDocument(() => {
      // Add random mouse movements with smaller variations
      Object.defineProperty(window.MouseEvent.prototype, 'movementX', {
        get: () => Math.floor(Math.random() * 3) - 1  // -1, 0, or 1
      });
      Object.defineProperty(window.MouseEvent.prototype, 'movementY', {
        get: () => Math.floor(Math.random() * 3) - 1  // -1, 0, or 1
      });
    });

    // Get viewport dimensions from profile or use defaults
    const screenWidth = profile.viewport?.width || 1920;
    const screenHeight = profile.viewport?.height || 1080;

    // Set realistic screen properties based on the viewport
    await page.evaluateOnNewDocument(({ width, height }) => {
      const screenProps = {
        width: { value: width },
        height: { value: height },
        availWidth: { value: width },
        availHeight: { value: height - 40 }, // Account for taskbar
        colorDepth: { value: 24 },
        pixelDepth: { value: 24 },
        availLeft: { value: 0 },
        availTop: { value: 0 }
      };
      
      try {
        Object.defineProperties(window.screen, screenProps);
      } catch (e) {
        // Fallback in case of error
        console.warn('Failed to set screen properties:', e);
      }
    }, { width: screenWidth, height: screenHeight });

    // Set viewport to auto-resize mode
    await page.setViewport({
      width: 0,
      height: 0,
      deviceScaleFactor: 1
    });
    
    // Add random delay before actions
    await this.waitForTimeout(Math.floor(Math.random() * 1000) + 500);
    
    // Set user agent if provided or use a randomized one
    const userAgent = profile.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    await page.setUserAgent(userAgent);

    // Set viewport if provided, but maintain responsive behavior
    if (profile.viewport) {
      const viewport = {
        ...profile.viewport,
        width: 0,
        height: 0,
        deviceScaleFactor: 1
      };
      await page.setViewport(viewport);
    }

    // Navigate to appropriate login page based on profile name
    const lowerProfileName = profile.name.toLowerCase();
    let loginUrl = 'https://google.com';
    if (lowerProfileName.includes('google')) {
      loginUrl = 'https://accounts.google.com';
    } else if (lowerProfileName.includes('facebook')) {
      loginUrl = 'https://www.facebook.com';
    } else if (lowerProfileName.includes('twitter')) {
      loginUrl = 'https://twitter.com/login';
    } else if (lowerProfileName.includes('linkedin')) {
      loginUrl = 'https://www.linkedin.com/login';
    }

    // Add random delay before navigation
    await this.waitForTimeout(Math.floor(Math.random() * 1000) + 500);

    // Navigate with random timing
    await page.goto(loginUrl, { 
      waitUntil: 'networkidle0',
      timeout: Math.floor(Math.random() * 5000) + 30000 
    });

    // Set permissions after navigation
    if (profile.permissions) {
      const context = page.browser().defaultBrowserContext();
      try {
        await context.overridePermissions(loginUrl, profile.permissions as Permission[]);
      } catch (error) {
        // Continue without permissions if they can't be set
      }
    }

    // Set geolocation if provided
    if (profile.geolocation) {
      try {
        await page.setGeolocation(profile.geolocation);
      } catch (error) {
        // Continue without geolocation if it can't be set
      }
    }

    // Set cookies if provided
    if (profile.cookies && profile.cookies.length > 0) {
      try {
        await page.setCookie(...profile.cookies);
      } catch (error) {
        // Continue without cookies if they can't be set
      }
    }

    // Apply any custom JavaScript
    if (profile.customJs) {
      try {
        await page.evaluate(profile.customJs);
      } catch (error) {
        // Continue without custom JS if it can't be applied
      }
    }
  }

  public async injectAntiDetection(): Promise<void> {
    const page = await this.getPage();
    const fingerprint = this.fingerprintService.getRandomFingerprint();
    
    // Apply website-specific evasions
    await this.websiteEvasionsService.applyEvasions(page as any);
    
    if (this.fingerprintService.shouldRotateFingerprint()) {
      this.logger('Rotating browser fingerprint');
      await this.rotateFingerprint(page);
    }

    // Inject fingerprint data
    await page.evaluateOnNewDocument((fp) => {
      // Override navigator properties
      Object.defineProperty(navigator, 'userAgent', { get: () => fp.userAgent });
      Object.defineProperty(navigator, 'platform', { get: () => fp.platform });
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => fp.cpu?.cores });
      Object.defineProperty(navigator, 'deviceMemory', { get: () => fp.memory?.deviceMemory });

      // Override screen properties
      if (fp.screen) {
        Object.defineProperties(screen, {
          width: { get: () => fp.screen?.width },
          height: { get: () => fp.screen?.height },
          availWidth: { get: () => fp.screen?.availWidth },
          availHeight: { get: () => fp.screen?.availHeight },
          colorDepth: { get: () => fp.screen?.colorDepth },
          pixelDepth: { get: () => fp.screen?.pixelDepth }
        });
      }

      // Add more fingerprint overrides as needed
    }, fingerprint);
  }

  public async performWebAutomation(actions: AutomationAction[]): Promise<AutomationResult> {
    const page = await this.getPage();
    const results: AutomationStepResult[] = [];
    let success = true;
    let extractedData: Record<string, any> = {};

    try {
      for (const [index, action] of actions.entries()) {
        try {
          this.logger(`Executing action ${index + 1}/${actions.length}: ${action.type}`);
          switch (action.type) {
            case 'openUrl':
              if (action.value) {
                this.logger(`Opening URL: ${action.value}`);
                await this.goto(action.value, { 
                  waitUntil: action.waitUntil || 'networkidle0',
                  timeout: action.timeout || 30000 
                });
                await this.humanBehaviorService.randomDelay(page as any, 1000, 2000);
              }
              break;
            case 'click':
              if (action.selector) {
                this.logger(`Clicking element: ${action.selector}`);
                await this.humanBehaviorService.humanMove(page as any, action.selector);
                await this.humanBehaviorService.randomDelay(page as any, 200, 500);
                await this.click(action.selector, {
                  button: action.button || 'left',
                  clickCount: action.clickCount || 1,
                  delay: action.delay || Math.floor(Math.random() * 100) + 50
                });
              }
              break;
            case 'type':
              if (action.selector && action.value) {
                this.logger(`Typing into element: ${action.selector}`);
                await this.humanBehaviorService.humanMove(page as any, action.selector);
                await this.humanBehaviorService.randomDelay(page as any, 200, 500);
                if (action.clearFirst) {
                  await page.click(action.selector, { clickCount: 3 });
                  await page.keyboard.press('Backspace');
                }
                await this.humanBehaviorService.humanType(page as any, action.selector, action.value);
              }
              break;
            case 'screenshot':
              const screenshotPath = action.value || `screenshot-${Date.now()}.png`;
              this.logger(`Taking screenshot: ${screenshotPath}`);
              await this.screenshot({ path: screenshotPath });
              break;
            case 'wait':
              if (action.condition === 'networkIdle') {
                this.logger('Waiting for network idle');
                await this.waitForLoadState('networkidle');
              } else if (action.condition === 'delay' && action.delay) {
                this.logger(`Waiting for ${action.delay}ms`);
                await this.waitForTimeout(action.delay);
              } else if (action.selector) {
                this.logger(`Waiting for selector: ${action.selector}`);
                await this.waitForSelector(action.selector, { timeout: action.timeout });
              }
              break;
            case 'extract':
              if (!action.selector) {
                throw new Error('Selector is required for extract action');
              }
              this.logger(`Extracting data from: ${action.selector}`);
              let extractedValue: string | null = null;
              if (action.attribute === 'text') {
                extractedValue = await page.$eval(action.selector, el => el.textContent);
              } else if (action.attribute) {
                extractedValue = await page.$eval(action.selector, (el, attr) => el.getAttribute(attr), action.attribute);
              } else {
                extractedValue = await page.$eval(action.selector, el => el.textContent);
              }
              if (action.key) {
                extractedData[action.key] = extractedValue;
                this.logger(`Extracted value stored in key: ${action.key}`);
              }
              break;
            case 'evaluate':
              if (!action.script) {
                throw new Error('Script is required for evaluate action');
              }
              const result = await this.evaluate(action.script);
              if (action.key) {
                extractedData[action.key] = result;
              }
              break;
            case 'keyboard':
              if (!action.key) {
                throw new Error('Key is required for keyboard action');
              }
              await page.keyboard.press(action.key as KeyInput);
              break;
            case 'select':
              if (!action.selector || !action.value) {
                throw new Error('Selector and value are required for select action');
              }
              await this.select(action.selector, action.value);
              break;
            case 'focus':
              if (!action.selector) {
                throw new Error('Selector is required for focus action');
              }
              await this.focus(action.selector);
              break;
            case 'hover':
              if (!action.selector) {
                throw new Error('Selector is required for hover action');
              }
              await this.hover(action.selector);
              break;
            case 'filePicker':
              const pickResult = await this.pickFile(
                action.filePath || '',
                {
                  fileName: action.fileName,
                  multiple: action.multiple,
                  directory: action.directory,
                  accept: action.accept
                }
              );
              
              // Store the result in variables if specified
              const variableKey = pickResult.variableKey || action.variableKey;
              if (variableKey) {
                extractedData[variableKey] = pickResult.paths;
                // Also store in _variables for backward compatibility
                extractedData._variables = extractedData._variables || {};
                extractedData._variables[variableKey] = pickResult.paths;
              }
              break;
          }
          results.push({ action, success: true });
          this.logger(`Action completed successfully: ${action.type}`);
        } catch (error) {
          this.logger(`Action failed: ${action.type} - ${error instanceof Error ? error.message : String(error)}`);
          results.push({
            action,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          if (action.stopOnError) {
            success = false;
            break;
          }
        }
        await this.humanBehaviorService.randomDelay(page as any, 500, 1500);
      }
    } catch (error) {
      success = false;
      this.logger(`Automation failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return { success, results, extractedData };
  }

  private async rotateFingerprint(page: Page): Promise<void> {
    const newFingerprint = this.fingerprintService.getRandomFingerprint();
    this.logger('Rotating browser fingerprint');
    await this.injectAntiDetection();
  }

  public async openUrl(url: string, waitUntil?: 'load' | 'domcontentloaded' | 'networkidle'): Promise<void> {
    const page = await this.getPage();
    const waitUntilOption = waitUntil === 'networkidle' ? 'networkidle0' : waitUntil;
    await page.goto(url, { waitUntil: waitUntilOption as 'load' | 'domcontentloaded' | 'networkidle0' });
  }

  public async uploadFile(selector: string, filePath: string): Promise<void> {
    const page = await this.getPage();
    const elementHandle = await page.$(selector);
    if (!elementHandle) {
      throw new Error(`File input element not found: ${selector}`);
    }
    const input = elementHandle as unknown as ElementHandle<HTMLInputElement>;
    await input.uploadFile(filePath);
  }

  public async extract(selector: string, attribute?: string): Promise<string> {
    const page = await this.getPage();
    if (attribute === 'text' || !attribute) {
      const text = await page.$eval(selector, (el: Element) => el.textContent || '');
      return text.trim();
    } else {
      const value = await page.$eval(selector, (el: Element, attr: string) => el.getAttribute(attr) || '', attribute);
      return value;
    }
  }
} 