import { Request, Response } from 'express';
import { Browser, chromium } from 'playwright';
import { BrowserContext } from 'playwright';

class WorkflowController {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  private async initBrowser() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: false, // For development, set to true in production
      });
    }
    if (!this.context) {
      this.context = await this.browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
    }
    return this.context.newPage();
  }

  async openUrl(req: Request, res: Response) {
    try {
      const { url, waitForLoad = true, timeout = 30000 } = req.body;
      const page = await this.initBrowser();

      await page.goto(url, {
        waitUntil: waitForLoad ? 'networkidle' : 'commit',
        timeout,
      });

      const pageTitle = await page.title();
      const pageUrl = page.url();

      res.json({
        success: true,
        pageTitle,
        pageUrl,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to open URL',
      });
    }
  }

  async click(req: Request, res: Response) {
    try {
      const { selector, button = 'left', clickCount = 1, timeout = 5000 } = req.body;
      const page = await this.initBrowser();

      await page.waitForSelector(selector, { timeout });
      await page.click(selector, { button, clickCount });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to click element',
      });
    }
  }

  async input(req: Request, res: Response) {
    try {
      const { selector, value, clearFirst = true, timeout = 5000 } = req.body;
      const page = await this.initBrowser();

      await page.waitForSelector(selector, { timeout });
      
      if (clearFirst) {
        await page.fill(selector, '');
      }
      
      await page.type(selector, value);

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to input text',
      });
    }
  }

  async submit(req: Request, res: Response) {
    try {
      const { selector, waitForNavigation = true, timeout = 5000 } = req.body;
      const page = await this.initBrowser();

      await page.waitForSelector(selector, { timeout });

      if (waitForNavigation) {
        await Promise.all([
          page.waitForNavigation({ timeout }),
          page.click(selector),
        ]);
      } else {
        await page.click(selector);
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit form',
      });
    }
  }

  async wait(req: Request, res: Response) {
    try {
      const { condition, selector, delay = 1000, timeout = 5000 } = req.body;
      const page = await this.initBrowser();

      switch (condition) {
        case 'delay':
          await page.waitForTimeout(delay);
          break;
        case 'element':
          await page.waitForSelector(selector!, { timeout });
          break;
        case 'networkIdle':
          await page.waitForLoadState('networkidle', { timeout });
          break;
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Wait condition failed',
      });
    }
  }

  async condition(req: Request, res: Response) {
    try {
      const { selector, condition, value, attribute, timeout = 5000 } = req.body;
      const page = await this.initBrowser();

      await page.waitForSelector(selector, { timeout });
      let conditionMet = false;

      switch (condition) {
        case 'exists':
          conditionMet = await page.isVisible(selector);
          break;
        case 'visible':
          conditionMet = await page.isVisible(selector);
          break;
        case 'text':
          const text = await page.textContent(selector);
          conditionMet = text?.includes(value) ?? false;
          break;
        case 'attribute':
          const attrValue = await page.getAttribute(selector, attribute!);
          conditionMet = attrValue === value;
          break;
      }

      res.json({
        success: true,
        conditionMet,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Condition check failed',
      });
    }
  }

  async extract(req: Request, res: Response) {
    try {
      const { selector, extractType, attribute, timeout = 5000 } = req.body;
      const page = await this.initBrowser();

      await page.waitForSelector(selector, { timeout });
      let value: string | string[] | null = null;

      switch (extractType) {
        case 'text':
          value = await page.textContent(selector);
          break;
        case 'attribute':
          value = await page.getAttribute(selector, attribute!);
          break;
        case 'innerHTML':
          value = await page.innerHTML(selector);
          break;
        case 'list':
          value = await page.$$eval(selector, elements =>
            elements.map(el => el.textContent?.trim() || '')
          );
          break;
      }

      res.json({
        success: true,
        value,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extract data',
      });
    }
  }

  async loop(req: Request, res: Response) {
    try {
      const { condition, selector, maxIterations = 10, timeout = 5000, items = [] } = req.body;
      const page = await this.initBrowser();

      if (condition === 'forEach') {
        // Process array items
        for (let i = 0; i < items.length && i < maxIterations; i++) {
          res.json({
            success: true,
            currentItem: items[i],
            index: i,
            completed: i === items.length - 1,
          });
          await page.waitForTimeout(100); // Small delay between iterations
        }
      } else {
        // While condition
        let iterations = 0;
        while (iterations < maxIterations) {
          const exists = await page.isVisible(selector);
          if (!exists) break;

          res.json({
            success: true,
            currentItem: null,
            index: iterations,
            completed: false,
          });

          iterations++;
          await page.waitForTimeout(100);
        }

        res.json({
          success: true,
          currentItem: null,
          index: iterations,
          completed: true,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Loop execution failed',
      });
    }
  }

  async cleanup() {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const workflowController = new WorkflowController(); 