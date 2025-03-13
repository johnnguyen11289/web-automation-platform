import puppeteer, { Browser, Page, PuppeteerLifeCycleEvent, Permission, KeyInput, LaunchOptions, PuppeteerLaunchOptions } from 'puppeteer';
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
    
    process.on('SIGTERM', () => this.cleanup());
    process.on('SIGINT', () => this.cleanup());
    process.on('exit', () => this.cleanup());
  }

  private async cleanup() {
    console.log('Cleaning up browser resources...');
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
      console.log('[Puppeteer] Initializing browser with profile:', {
        isHeadless: this.currentProfile?.isHeadless,
        browserType: this.currentProfile?.browserType,
        automationLibrary: this.currentProfile?.automationLibrary
      });

      const options: PuppeteerLaunchOptions = {
        headless: this.currentProfile?.isHeadless ? "new" : false,
        executablePath: this.getChromePath(),
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920,1080',
          '--remote-debugging-port=9222'
        ]
      };

      console.log('[Puppeteer] Launching browser with options:', options);
      this.browser = await puppeteer.launch(options);
      console.log('[Puppeteer] Browser launched successfully');
      
      this.currentPage = await this.browser.newPage();
      console.log('[Puppeteer] New page created');
      
      // Set default viewport
      await this.currentPage.setViewport({
        width: 1920,
        height: 1080
      });
      console.log('[Puppeteer] Viewport set to 1920x1080');
    } else {
      console.log('[Puppeteer] Browser already initialized');
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
    await page.goto(url, {
      waitUntil: (options?.waitUntil === 'networkidle' ? 'networkidle0' : options?.waitUntil) as PuppeteerLifeCycleEvent,
      timeout: options?.timeout
    });
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
    const screenshot = await page.screenshot({ path: options?.path });
    return Buffer.from(screenshot);
  }

  public async openProfileForSetup(profile: BrowserProfile): Promise<void> {
    const page = await this.getPage();
    
    // Set user agent if provided
    if (profile.userAgent) {
      await page.setUserAgent(profile.userAgent);
    }

    // Set viewport if provided
    if (profile.viewport) {
      await page.setViewport(profile.viewport);
    }

    // Navigate to appropriate login page based on profile name
    const lowerProfileName = profile.name.toLowerCase();
    let loginUrl = 'https://example.com'; // Default to a real URL instead of about:blank
    if (lowerProfileName.includes('google')) {
      loginUrl = 'https://accounts.google.com';
    } else if (lowerProfileName.includes('facebook')) {
      loginUrl = 'https://www.facebook.com';
    } else if (lowerProfileName.includes('twitter')) {
      loginUrl = 'https://twitter.com/login';
    } else if (lowerProfileName.includes('linkedin')) {
      loginUrl = 'https://www.linkedin.com/login';
    }

    // Navigate first
    await page.goto(loginUrl, { waitUntil: 'networkidle0' });

    // Set permissions after navigation
    if (profile.permissions) {
      const context = page.browser().defaultBrowserContext();
      try {
        await context.overridePermissions(loginUrl, profile.permissions as Permission[]);
      } catch (error) {
        console.warn('Failed to set permissions:', error);
        // Continue without permissions if they can't be set
      }
    }

    // Set geolocation if provided
    if (profile.geolocation) {
      try {
        await page.setGeolocation(profile.geolocation);
      } catch (error) {
        console.warn('Failed to set geolocation:', error);
        // Continue without geolocation if it can't be set
      }
    }

    // Set cookies if provided
    if (profile.cookies && profile.cookies.length > 0) {
      try {
        await page.setCookie(...profile.cookies);
      } catch (error) {
        console.warn('Failed to set cookies:', error);
        // Continue without cookies if they can't be set
      }
    }

    // Apply any custom JavaScript
    if (profile.customJs) {
      try {
        await page.evaluate(profile.customJs);
      } catch (error) {
        console.warn('Failed to apply custom JavaScript:', error);
        // Continue without custom JS if it can't be applied
      }
    }

    console.log('Profile opened for manual setup. Please perform any necessary logins or configurations.');
  }

  public async injectAntiDetection(): Promise<void> {
    const page = await this.getPage();
    const fingerprint = this.fingerprintService.getRandomFingerprint();
    
    // Apply website-specific evasions
    await this.websiteEvasionsService.applyEvasions(page as any);
    
    if (this.fingerprintService.shouldRotateFingerprint()) {
      console.log('Rotating browser fingerprint...');
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
    console.log('[Puppeteer] Starting web automation with profile:', {
      isHeadless: this.currentProfile?.isHeadless,
      browserType: this.currentProfile?.browserType,
      automationLibrary: this.currentProfile?.automationLibrary
    });

    const page = await this.getPage();
    const results: AutomationStepResult[] = [];
    let success = true;
    let extractedData: Record<string, any> = {};

    try {
      console.log(`[Puppeteer] Starting automation with ${actions.length} actions`);
      
      for (const [index, action] of actions.entries()) {
        try {
          console.log(`[Puppeteer] Executing action ${index + 1}/${actions.length}:`, {
            type: action.type,
            selector: action.selector,
            value: action.value
          });
          
          switch (action.type) {
            case 'openUrl':
              if (action.value) {
                console.log(`[Puppeteer] Navigating to URL: ${action.value}`);
                await this.goto(action.value, { 
                  waitUntil: action.waitUntil || 'networkidle0',
                  timeout: action.timeout || 30000 
                });
                console.log('[Puppeteer] Navigation completed');
                await this.humanBehaviorService.randomDelay(page as any, 1000, 2000);
              }
              break;
            case 'click':
              if (action.selector) {
                await this.humanBehaviorService.humanMove(page as any, action.selector);
                await this.humanBehaviorService.randomDelay(page as any, 200, 500);
                await this.click(action.selector, {
                  button: action.button || 'left',
                  clickCount: action.clickCount || 1,
                  delay: action.delay || Math.floor(Math.random() * 100) + 50
                });
                console.log(`[Puppeteer] Clicked element: ${action.selector}`);
              }
              break;
            case 'type':
              if (action.selector && action.value) {
                await this.humanBehaviorService.humanMove(page as any, action.selector);
                await this.humanBehaviorService.randomDelay(page as any, 200, 500);
                if (action.clearFirst) {
                  await page.click(action.selector, { clickCount: 3 });
                  await page.keyboard.press('Backspace');
                }
                await this.humanBehaviorService.humanType(page as any, action.selector, action.value);
                console.log(`[Puppeteer] Typed into element: ${action.selector}`);
              }
              break;
            case 'screenshot':
              const screenshotPath = action.value || `screenshot-${Date.now()}.png`;
              await this.screenshot({ path: screenshotPath });
              console.log(`[Puppeteer] Screenshot saved: ${screenshotPath}`);
              break;
            case 'wait':
              if (action.condition === 'networkIdle') {
                console.log('[Puppeteer] Waiting for network idle');
                await this.waitForLoadState('networkidle');
              } else if (action.condition === 'delay' && action.delay) {
                console.log(`[Puppeteer] Waiting for ${action.delay}ms`);
                await this.waitForTimeout(action.delay);
              } else if (action.selector) {
                console.log(`[Puppeteer] Waiting for selector: ${action.selector}`);
                await this.waitForSelector(action.selector, { timeout: action.timeout });
              }
              break;
            case 'extract':
              if (!action.selector) {
                throw new Error('Selector is required for extract action');
              }
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
                console.log(`[Puppeteer] Extracted data for key "${action.key}": ${extractedValue}`);
              }
              break;
            case 'evaluate':
              if (!action.script) {
                throw new Error('Script is required for evaluate action');
              }
              const result = await this.evaluate(action.script);
              if (action.key) {
                extractedData[action.key] = result;
                console.log(`[Puppeteer] Evaluated script result for key "${action.key}": ${result}`);
              }
              break;
            case 'keyboard':
              if (!action.key) {
                throw new Error('Key is required for keyboard action');
              }
              await page.keyboard.press(action.key as KeyInput);
              console.log(`[Puppeteer] Pressed key: ${action.key}`);
              break;
            case 'select':
              if (!action.selector || !action.value) {
                throw new Error('Selector and value are required for select action');
              }
              await this.select(action.selector, action.value);
              console.log(`[Puppeteer] Selected value "${action.value}" for element: ${action.selector}`);
              break;
            case 'focus':
              if (!action.selector) {
                throw new Error('Selector is required for focus action');
              }
              await this.focus(action.selector);
              console.log(`[Puppeteer] Focused element: ${action.selector}`);
              break;
            case 'hover':
              if (!action.selector) {
                throw new Error('Selector is required for hover action');
              }
              await this.hover(action.selector);
              console.log(`[Puppeteer] Hovered over element: ${action.selector}`);
              break;
          }
          results.push({ action, success: true });
        } catch (error) {
          console.error(`[Puppeteer] Action failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      console.error(`[Puppeteer] Automation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      success = false;
    }

    console.log(`[Puppeteer] Automation completed. Success: ${success}`);
    return { success, results, extractedData };
  }

  private async rotateFingerprint(page: Page): Promise<void> {
    const newFingerprint = this.fingerprintService.getRandomFingerprint();
    await this.injectAntiDetection();
  }
} 