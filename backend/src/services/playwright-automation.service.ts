import { chromium, firefox, webkit, Browser, Page } from 'playwright-core';
import { IBrowserAutomation } from '../interfaces/browser-automation.interface';
import { BrowserProfile } from '../types/browser.types';
import { AutomationAction, AutomationResult, AutomationStepResult } from '../types/automation.types';
import { BrowserFingerprintService } from './browser-fingerprint.service';
import { HumanBehaviorService } from './human-behavior.service';
import { WebsiteEvasionsService } from './website-evasions.service';
import * as path from 'path';
import * as os from 'os';

export class PlaywrightAutomationService implements IBrowserAutomation {
  private browser: Browser | null = null;
  private currentProfile: BrowserProfile | null = null;
  private currentPage: Page | null = null;
  private static instance: PlaywrightAutomationService | null = null;
  private fingerprintService: BrowserFingerprintService;
  private humanBehaviorService: HumanBehaviorService;
  private websiteEvasionsService: WebsiteEvasionsService;

  public static getInstance(): PlaywrightAutomationService {
    if (!PlaywrightAutomationService.instance) {
      PlaywrightAutomationService.instance = new PlaywrightAutomationService();
    }
    return PlaywrightAutomationService.instance;
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
    PlaywrightAutomationService.instance = null;
  }

  public async initialize(): Promise<void> {
    if (!this.browser) {
      const options = {
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

      this.browser = await chromium.launch(options);
      this.currentPage = await this.browser.newPage();
      
      // Set default viewport
      await this.currentPage.setViewportSize({
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
    await page.goto(url, options);
  }

  public async click(selector: string, options?: { button?: 'left' | 'right' | 'middle', clickCount?: number, delay?: number }): Promise<void> {
    const page = await this.getPage();
    await page.click(selector, options);
  }

  public async type(selector: string, text: string, options?: { delay?: number }): Promise<void> {
    const page = await this.getPage();
    await page.type(selector, text, options);
  }

  public async select(selector: string, value: string): Promise<void> {
    const page = await this.getPage();
    await page.selectOption(selector, value);
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
    await page.waitForSelector(selector, options);
  }

  public async waitForLoadState(state: 'load' | 'domcontentloaded' | 'networkidle'): Promise<void> {
    const page = await this.getPage();
    await page.waitForLoadState(state);
  }

  public async waitForTimeout(ms: number): Promise<void> {
    const page = await this.getPage();
    await page.waitForTimeout(ms);
  }

  public async evaluate(script: string): Promise<any> {
    const page = await this.getPage();
    return page.evaluate(script);
  }

  public async screenshot(options?: { path?: string }): Promise<Buffer> {
    const page = await this.getPage();
    return page.screenshot(options);
  }

  public async openProfileForSetup(profile: BrowserProfile): Promise<void> {
    // Implementation from the original AutomationService
    // ... (copy the implementation from the original file)
  }

  public async injectAntiDetection(): Promise<void> {
    const page = await this.getPage();
    const fingerprint = this.fingerprintService.getRandomFingerprint();
    await this.websiteEvasionsService.applyEvasions(page);
    
    if (this.fingerprintService.shouldRotateFingerprint()) {
      console.log('Rotating browser fingerprint...');
      await this.rotateFingerprint(page);
    }
  }

  public async performWebAutomation(actions: AutomationAction[]): Promise<AutomationResult> {
    const page = await this.getPage();
    const results: AutomationStepResult[] = [];
    let success = true;
    let extractedData: Record<string, any> = {};

    try {
      for (const action of actions) {
        try {
          switch (action.type) {
            case 'openUrl':
              if (action.value) {
                await this.goto(action.value, { waitUntil: 'networkidle', timeout: 30000 });
                await this.humanBehaviorService.randomDelay(page, 1000, 2000);
              }
              break;
            case 'click':
              if (action.selector) {
                await this.humanBehaviorService.humanMove(page, action.selector);
                await this.humanBehaviorService.randomDelay(page, 200, 500);
                await this.click(action.selector, {
                  button: action.button || 'left',
                  clickCount: action.clickCount || 1,
                  delay: action.delay || Math.floor(Math.random() * 100) + 50
                });
              }
              break;
            case 'type':
              if (action.selector && action.value) {
                await this.humanBehaviorService.humanMove(page, action.selector);
                await this.humanBehaviorService.randomDelay(page, 200, 500);
                if (action.clearFirst) {
                  await page.click(action.selector, { clickCount: 3 });
                  await page.keyboard.press('Backspace');
                }
                await this.type(action.selector, action.value, { delay: action.delay });
              }
              break;
            case 'select':
              if (action.selector && action.value) {
                await this.select(action.selector, action.value);
              }
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
              if (action.selector) {
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
              }
              break;
            case 'evaluate':
              if (action.script) {
                const result = await this.evaluate(action.script);
                if (action.key) {
                  extractedData[action.key] = result;
                }
              }
              break;
            case 'keyboard':
              if (action.key) {
                await page.keyboard.press(action.key);
              }
              break;
            case 'focus':
              if (action.selector) {
                await this.focus(action.selector);
              }
              break;
            case 'hover':
              if (action.selector) {
                await this.hover(action.selector);
              }
              break;
            case 'screenshot':
              if (action.value) {
                await this.screenshot({ path: action.value });
              }
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
        await this.humanBehaviorService.randomDelay(page, 500, 1500);
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