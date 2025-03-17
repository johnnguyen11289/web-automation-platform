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

  private async handleWaitConditions(selector: string, waitForSelector?: string, waitForSelectorRemoval?: string, timeout?: number): Promise<void> {
    const page = await this.getPage();
    
    // Wait for selector to appear if specified
    if (waitForSelector) {
      try {
        await page.waitForSelector(waitForSelector, {
          timeout: timeout || 5000,
          visible: true
        });
      } catch (error) {
        throw new Error(`Timeout waiting for selector to appear: ${waitForSelector}`);
      }
    }

    // Wait for selector to be removed if specified
    if (waitForSelectorRemoval) {
      try {
        await page.waitForSelector(waitForSelectorRemoval, {
          timeout: timeout || 5000,
          hidden: true
        });
      } catch (error) {
        throw new Error(`Timeout waiting for selector to be removed: ${waitForSelectorRemoval}`);
      }
    }
  }

  public async click(selector: string, options?: { button?: 'left' | 'right' | 'middle', clickCount?: number, delay?: number }): Promise<void> {
    const page = await this.getPage();
    await this.handleWaitConditions(selector, selector);
    await page.click(selector, options);
  }

  public async type(selector: string, value: string): Promise<void> {
    const page = await this.getPage();
    await this.handleWaitConditions(selector, selector);
    await page.type(selector, value);
  }

  public async select(selector: string, value: string): Promise<void> {
    const page = await this.getPage();
    await this.handleWaitConditions(selector, selector);
    await page.select(selector, value);
  }

  public async extract(selector: string, attribute: string = 'text'): Promise<string> {
    const page = await this.getPage();
    await this.handleWaitConditions(selector, selector);
    return await page.$eval(selector, (el, attr) => {
      if (attr === 'text') return el.textContent || '';
      return el.getAttribute(attr) || '';
    }, attribute);
  }

  public async uploadFile(selector: string, filePath: string): Promise<void> {
    const page = await this.getPage();
    await this.handleWaitConditions(selector, selector);
    const [fileChooser] = await Promise.all([
      page.waitForFileChooser(),
      page.click(selector)
    ]);
    await fileChooser.accept([filePath]);
  }

  public async focus(selector: string): Promise<void> {
    const page = await this.getPage();
    await this.handleWaitConditions(selector, selector);
    await page.focus(selector);
  }

  public async hover(selector: string): Promise<void> {
    const page = await this.getPage();
    await this.handleWaitConditions(selector, selector);
    await page.hover(selector);
  }

  public async screenshot(options?: { selector?: string, path?: string }): Promise<Buffer> {
    const page = await this.getPage();
    
    if (options?.selector) {
      // Handle element screenshot
      await this.handleWaitConditions(options.selector, options.selector);
      const element = await page.$(options.selector);
      if (!element) throw new Error(`Element not found: ${options.selector}`);
      const screenshot = await element.screenshot({ path: options.path });
      return Buffer.from(screenshot);
    } else {
      // Handle full page screenshot
      const screenshot = await page.screenshot({ path: options?.path });
      return Buffer.from(screenshot);
    }
  }

  public async dragDrop(sourceSelector: string, targetSelector: string): Promise<void> {
    const page = await this.getPage();
    await this.handleWaitConditions(sourceSelector, sourceSelector, targetSelector);
    
    // Get the source and target elements
    const sourceElement = await page.$(sourceSelector);
    const targetElement = await page.$(targetSelector);
    
    if (!sourceElement || !targetElement) {
      throw new Error('Source or target element not found');
    }

    // Get the bounding boxes
    const sourceBox = await sourceElement.boundingBox();
    const targetBox = await targetElement.boundingBox();
    
    if (!sourceBox || !targetBox) {
      throw new Error('Could not get element positions');
    }

    // Move to source element
    await page.mouse.move(
      sourceBox.x + sourceBox.width / 2,
      sourceBox.y + sourceBox.height / 2
    );

    // Press mouse button
    await page.mouse.down();

    // Move to target element
    await page.mouse.move(
      targetBox.x + targetBox.width / 2,
      targetBox.y + targetBox.height / 2
    );

    // Release mouse button
    await page.mouse.up();
  }

  public async waitForSelector(selector: string, options?: { timeout?: number }): Promise<void> {
    const page = await this.getPage();
    await page.waitForSelector(selector, options);
  }

  public async waitForSelectorRemoval(selector: string, options?: { timeout?: number }): Promise<void> {
    const page = await this.getPage();
    await page.waitForFunction(
      (sel) => !document.querySelector(sel),
      { timeout: options?.timeout || 30000 },
      selector
    );
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
    return await page.evaluate(script);
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
    const results: AutomationStepResult[] = [];
    const extractedData: Record<string, any> = {};

    try {
      for (const action of actions) {
        try {
          const page = await this.getPage();
          
          switch (action.type) {
            case 'openUrl':
              if (!action.url) throw new Error('URL is required for openUrl action');
              await this.openUrl(action.url, action.waitUntil as 'load' | 'domcontentloaded' | 'networkidle');
              break;

            case 'click':
              if (!action.selector) throw new Error('Selector is required for click action');
              await this.handleWaitConditions(action.selector, action.waitForSelector, action.waitForSelectorRemoval);
              await page.click(action.selector, {
                button: action.button || 'left',
                clickCount: action.clickCount || 1,
                delay: action.delay
              });
              break;

            case 'type':
              if (!action.selector || !action.value) throw new Error('Selector and value are required for type action');
              await this.handleWaitConditions(action.selector, action.waitForSelector, action.waitForSelectorRemoval);
              if (action.clearFirst) await page.$eval(action.selector, (el: any) => el.value = '');
              await page.type(action.selector, action.value, { delay: action.delay });
              break;

            case 'select':
              if (!action.selector || !action.value) throw new Error('Selector and value are required for select action');
              await this.handleWaitConditions(action.selector, action.waitForSelector, action.waitForSelectorRemoval);
              await page.select(action.selector, action.value);
              break;

            case 'extract':
              if (!action.selector) throw new Error('Selector is required for extract action');
              await this.handleWaitConditions(action.selector, action.waitForSelector, action.waitForSelectorRemoval);
              const value = await page.$eval(action.selector, (el: any, attr: string) => {
                if (attr === 'text') return el.textContent || '';
                return el.getAttribute(attr) || '';
              }, action.attribute || 'text');
              if (action.variableKey) extractedData[action.variableKey] = value;
              break;

            case 'fileUpload':
              if (!action.selector || !action.filePath) throw new Error('Selector and filePath are required for fileUpload action');
              await this.handleWaitConditions(action.selector, action.waitForSelector, action.waitForSelectorRemoval);
              const [fileChooser] = await Promise.all([
                page.waitForFileChooser(),
                page.click(action.selector)
              ]);
              await fileChooser.accept([action.filePath]);
              break;

            case 'wait':
              if (action.condition === 'delay') {
                await this.waitForTimeout(action.delay || 1000);
              } else if (action.condition === 'selectorPresent' && action.waitForSelector) {
                await this.waitForSelector(action.waitForSelector, { timeout: action.timeout });
              } else if (action.condition === 'selectorRemoved' && action.waitForSelectorRemoval) {
                await this.waitForSelectorRemoval(action.waitForSelectorRemoval, { timeout: action.timeout });
              }
              break;

            case 'focus':
              if (!action.selector) throw new Error('Selector is required for focus action');
              await this.handleWaitConditions(action.selector, action.waitForSelector, action.waitForSelectorRemoval);
              await page.focus(action.selector);
              break;

            case 'hover':
              if (!action.selector) throw new Error('Selector is required for hover action');
              await this.handleWaitConditions(action.selector, action.waitForSelector, action.waitForSelectorRemoval);
              await page.hover(action.selector);
              break;

            case 'screenshot':
              if (!action.selector || !action.path) throw new Error('Selector and path are required for screenshot action');
              await this.handleWaitConditions(action.selector, action.waitForSelector, action.waitForSelectorRemoval);
              const element = await page.$(action.selector);
              if (!element) throw new Error(`Element not found: ${action.selector}`);
              await element.screenshot({ path: action.path });
              break;

            case 'dragDrop':
              if (!action.sourceSelector || !action.targetSelector) throw new Error('sourceSelector and targetSelector are required for dragDrop action');
              await this.handleWaitConditions(action.sourceSelector, action.sourceSelector, action.targetSelector);
              const sourceElement = await page.$(action.sourceSelector);
              const targetElement = await page.$(action.targetSelector);
              if (!sourceElement || !targetElement) throw new Error('Source or target element not found');
              const sourceBox = await sourceElement.boundingBox();
              const targetBox = await targetElement.boundingBox();
              if (!sourceBox || !targetBox) throw new Error('Could not get element positions');
              await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
              await page.mouse.down();
              await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
              await page.mouse.up();
              break;

            case 'keyboard':
              if (!action.key) throw new Error('Key is required for keyboard action');
              await this.keyboard(action.key as KeyInput);
              break;

            case 'evaluate':
              if (!action.script) throw new Error('Script is required for evaluate action');
              await this.evaluate(action.script);
              break;
          }

          results.push({ action, success: true });
        } catch (error) {
          results.push({ action, success: false, error: error instanceof Error ? error.message : String(error) });
          if (action.stopOnError) throw error;
        }
      }

      return { success: true, results, extractedData };
    } catch (error) {
      return { success: false, results, extractedData };
    }
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

  public async keyboard(key: KeyInput): Promise<void> {
    const page = await this.getPage();
    await page.keyboard.press(key);
  }
} 