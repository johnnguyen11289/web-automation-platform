import puppeteer, { Browser, Page, PuppeteerLifeCycleEvent, Permission, KeyInput, LaunchOptions } from 'puppeteer';
import { IBrowserAutomation } from '../interfaces/browser-automation.interface';
import { BrowserProfile } from '../types/browser.types';
import { AutomationAction, AutomationResult, AutomationStepResult } from '../types/automation.types';
import { BrowserFingerprintService } from './browser-fingerprint.service';
import { HumanBehaviorService } from './human-behavior.service';
import { WebsiteEvasionsService } from './website-evasions.service';
import * as path from 'path';
import * as os from 'os';

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

  public async initialize(): Promise<void> {
    if (!this.browser) {
      const options: LaunchOptions = {
        headless: false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920,1080'
        ]
      };

      this.browser = await puppeteer.launch(options);
      this.currentPage = await this.browser.newPage();
      
      // Set default viewport
      await this.currentPage.setViewport({
        width: 1920,
        height: 1080
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

  public async goto(url: string, options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle', timeout?: number }): Promise<void> {
    const page = await this.getPage();
    await page.goto(url, {
      waitUntil: (options?.waitUntil || 'networkidle0') as PuppeteerLifeCycleEvent,
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
    const page = await this.getPage();
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

    // Set geolocation if provided
    if (profile.geolocation) {
      await page.setGeolocation(profile.geolocation);
    }

    // Set permissions if provided
    if (profile.permissions) {
      const context = page.browser().defaultBrowserContext();
      await context.overridePermissions(page.url(), profile.permissions as Permission[]);
    }

    // Set cookies if provided
    if (profile.cookies && profile.cookies.length > 0) {
      await page.setCookie(...profile.cookies);
    }

    // Apply any custom JavaScript
    if (profile.customJs) {
      await page.evaluate(profile.customJs);
    }

    // Navigate to appropriate login page based on profile name
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

  public async performWebAutomation(url: string | null, actions: AutomationAction[]): Promise<AutomationResult> {
    const page = await this.getPage();
    const results: AutomationStepResult[] = [];
    let success = true;
    let extractedData: Record<string, any> = {};

    try {
      if (url) {
        await this.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await this.humanBehaviorService.randomDelay(page as any, 1000, 2000);
      }

      for (const action of actions) {
        try {
          switch (action.type) {
            case 'click':
              if (action.selector) {
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
              await this.screenshot({ path: screenshotPath });
              break;
            case 'wait':
              if (action.condition === 'networkIdle') {
                await this.waitForLoadState('networkidle');
              } else if (action.condition === 'delay' && action.delay) {
                await this.waitForTimeout(action.delay);
              } else if (action.selector) {
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
          }
          results.push({ action, success: true });
        } catch (error) {
          console.error('Action failed:', error);
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
      console.error('Automation failed:', error);
      success = false;
    }

    return { success, results, extractedData };
  }

  private async rotateFingerprint(page: Page): Promise<void> {
    const newFingerprint = this.fingerprintService.getRandomFingerprint();
    await this.injectAntiDetection();
  }
} 