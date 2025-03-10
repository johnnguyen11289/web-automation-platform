import { chromium, Browser, Page } from 'playwright';

export class AutomationService {
  private browser: Browser | null = null;

  async init() {
    this.browser = await chromium.launch({
      headless: process.env.NODE_ENV === 'production',
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private async createPage(): Promise<Page> {
    if (!this.browser) {
      await this.init();
    }
    if (!this.browser) {
      throw new Error('Browser initialization failed');
    }
    return await this.browser.newPage();
  }

  async performWebAutomation(url: string, actions: AutomationAction[]): Promise<AutomationResult> {
    const page = await this.createPage();
    const results: AutomationStepResult[] = [];
    let success = true;

    try {
      await page.goto(url);

      for (const action of actions) {
        try {
          switch (action.type) {
            case 'click':
              if (!action.selector) {
                throw new Error('Selector is required for click action');
              }
              await page.click(action.selector);
              break;
            case 'type':
              if (!action.selector) {
                throw new Error('Selector is required for type action');
              }
              await page.fill(action.selector, action.value || '');
              break;
            case 'screenshot':
              if (!action.value) {
                throw new Error('File path is required for screenshot action');
              }
              await page.screenshot({ path: action.value });
              break;
            case 'wait':
              if (!action.selector) {
                throw new Error('Selector is required for wait action');
              }
              await page.waitForSelector(action.selector);
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
        }
      }

      return { success, results };
    } finally {
      await page.close();
    }
  }
}

export interface AutomationAction {
  type: 'click' | 'type' | 'screenshot' | 'wait';
  selector?: string;
  value?: string;
}

export interface AutomationStepResult {
  action: AutomationAction;
  success: boolean;
  error?: string;
}

export interface AutomationResult {
  success: boolean;
  results: AutomationStepResult[];
} 