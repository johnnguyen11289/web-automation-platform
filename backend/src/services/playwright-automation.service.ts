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
    await this.close();
    PlaywrightAutomationService.instance = null;
  }

  public async initialize(): Promise<void> {
    if (!this.browser) {
      const options = {
        headless: this.currentProfile?.isHeadless ?? false,
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

  public async waitForSelectorRemoval(selector: string, options?: { timeout?: number }): Promise<void> {
    const page = await this.getPage();
    await page.waitForFunction(
      (sel: string) => !document.querySelector(sel),
      selector,
      { timeout: options?.timeout || 30000 }
    );
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
    // Implementation from the original AutomationService
    // ... (copy the implementation from the original file)
  }

  public async injectAntiDetection(): Promise<void> {
    const page = await this.getPage();
    const fingerprint = this.fingerprintService.getRandomFingerprint();
    await this.websiteEvasionsService.applyEvasions(page);
    
    if (this.fingerprintService.shouldRotateFingerprint()) {
      await this.rotateFingerprint(page);
    }
  }

  public async performWebAutomation(actions: AutomationAction[]): Promise<AutomationResult> {
    const page = await this.getPage();
    const results: AutomationStepResult[] = [];
    let success = true;
    let extractedData: Record<string, any> = {};

    try {
      for (const [index, action] of actions.entries()) {
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
                if (!action.delay) {
                  await this.humanBehaviorService.randomDelay(page, 200, 500);
                }
                await this.click(action.selector, {
                  button: action.button || 'left',
                  clickCount: action.clickCount || 1,
                  delay: action.delay
                });
              }
              break;
            case 'type':
              if (action.selector && action.value) {
                await this.humanBehaviorService.humanMove(page, action.selector);
                if (!action.delay) {
                  await this.humanBehaviorService.randomDelay(page, 200, 500);
                }
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
        } catch (error) {
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
      success = false;
    }

    return { success, results, extractedData };
  }

  private async rotateFingerprint(page: Page): Promise<void> {
    const newFingerprint = this.fingerprintService.getRandomFingerprint();
    await this.injectAntiDetection();
  }

  public async openUrl(url: string, waitUntil?: 'load' | 'domcontentloaded' | 'networkidle'): Promise<void> {
    await this.goto(url, { waitUntil });
  }

  public async uploadFile(selector: string, filePath: string): Promise<void> {
    const page = await this.getPage();
    const input = await page.$(selector);
    if (!input) {
      throw new Error(`File input element not found: ${selector}`);
    }
    await input.setInputFiles(filePath);
  }

  public async extract(selector: string, attribute?: string): Promise<string> {
    const page = await this.getPage();
    if (attribute === 'text' || !attribute) {
      const text = await page.$eval(selector, el => el.textContent || '');
      return text.trim();
    } else {
      const value = await page.$eval(selector, (el, attr) => el.getAttribute(attr) || '', attribute);
      return value;
    }
  }

  public setProfile(profile: BrowserProfile): void {
    this.currentProfile = profile;
  }
} 