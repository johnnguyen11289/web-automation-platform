import { IBrowserAutomation } from '../interfaces/browser-automation.interface';
import { AutomationAction, AutomationResult } from '../types/automation.types';
import { BrowserProfile } from '../types/browser.types';
import { PlaywrightAutomationService } from './playwright-automation.service';
import { PuppeteerAutomationService } from './puppeteer-automation.service';

export { AutomationAction } from '../types/automation.types';

export class AutomationService {
  private static instance: AutomationService | null = null;
  private automation: IBrowserAutomation | null = null;
  private currentProfile: BrowserProfile | null = null;

  private constructor() {}

  public static getInstance(): AutomationService {
    if (!AutomationService.instance) {
      AutomationService.instance = new AutomationService();
    }
    return AutomationService.instance;
  }

  private getAutomationLibrary(profile: BrowserProfile): IBrowserAutomation {
    // Close existing automation if it exists
    if (this.automation) {
      this.automation.close().catch(console.error);
    }

    switch (profile.automationLibrary?.toLowerCase()) {
      case 'playwright':
        return PlaywrightAutomationService.getInstance();
      case 'puppeteer':
        return PuppeteerAutomationService.getInstance();
      default:
        // Default to Playwright if no library specified
        return PlaywrightAutomationService.getInstance();
    }
  }

  public async applyProfile(profile: BrowserProfile): Promise<void> {
    try {
      // Close existing automation if it exists
      if (this.automation) {
        await this.automation.close();
      }

      this.currentProfile = profile;
      this.automation = this.getAutomationLibrary(profile);
      await this.initialize();
    } catch (error) {
      console.error('Failed to apply profile:', error);
      throw error;
    }
  }

  // For backward compatibility
  public async init(useLocalChrome: boolean = false, profile?: BrowserProfile): Promise<boolean> {
    try {
      // Close existing automation if it exists
      if (this.automation) {
        await this.automation.close();
      }

      if (profile) {
        await this.applyProfile(profile);
      } else {
        // If no profile provided, default to Puppeteer
        this.automation = PuppeteerAutomationService.getInstance();
        await this.initialize();
      }
      return true;
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      return false;
    }
  }

  public async initialize(): Promise<void> {
    if (!this.automation) {
      throw new Error('No automation library initialized. Call init() with a profile first.');
    }
    await this.automation.initialize();
  }

  public async close(): Promise<void> {
    if (!this.automation) {
      throw new Error('No automation library initialized. Call init() with a profile first.');
    }
    await this.automation.close();
  }

  public async performWebAutomation(url: string | null, actions: AutomationAction[]): Promise<AutomationResult> {
    if (!this.automation) {
      throw new Error('No automation library initialized. Call init() with a profile first.');
    }
    return this.automation.performWebAutomation(url, actions);
  }

  public async openProfileForSetup(profile: BrowserProfile): Promise<void> {
    if (!this.automation) {
      throw new Error('No automation library initialized. Call init() with a profile first.');
    }
    await this.automation.openProfileForSetup(profile);
  }

  public async injectAntiDetection(): Promise<void> {
    if (!this.automation) {
      throw new Error('No automation library initialized. Call init() with a profile first.');
    }
    await this.automation.injectAntiDetection();
  }
} 