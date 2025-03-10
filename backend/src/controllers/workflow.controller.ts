import { Request, Response } from 'express';
import { Browser, chromium, Page } from 'playwright';
import { BrowserContext } from 'playwright';
import { 
  OpenUrlNodeProperties, 
  ClickNodeProperties,
  InputNodeProperties,
  SubmitNodeProperties,
  WaitNodeProperties,
  ConditionNodeProperties,
  ExtractNodeProperties,
  LoopNodeProperties,
  ErrorHandlingStrategy 
} from '../types/node.types';

export class WorkflowController {
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
      const nodeProps: OpenUrlNodeProperties = req.body;
      
      // Validate required properties
      if (!nodeProps.url) {
        return res.status(400).json({
          success: false,
          error: 'URL is required'
        });
      }

      let page: Page = await this.initBrowser();
      let response;

      try {
        if (nodeProps.openInNewTab) {
          // Create a new page in a new tab
          const newPage = await this.context!.newPage();
          response = await newPage.goto(nodeProps.url, {
            waitUntil: nodeProps.waitForPageLoad ? 'networkidle' : 'commit',
            timeout: nodeProps.timeout,
          });
          page = newPage;
        } else {
          // Navigate in current page
          response = await page.goto(nodeProps.url, {
            waitUntil: nodeProps.waitForPageLoad ? 'networkidle' : 'commit',
            timeout: nodeProps.timeout,
          });
        }

        const result: any = {
          success: true,
          nodeName: nodeProps.nodeName,
        };

        if (nodeProps.returnPageData) {
          result.pageData = {
            title: await page.title(),
            url: page.url(),
            status: response?.status(),
            headers: response?.headers(),
          };
        }

        res.json(result);
      } catch (error) {
        // Handle error based on error handling strategy
        switch (nodeProps.errorHandling) {
          case 'retry':
            // Implement retry logic here
            throw error;
          case 'skip':
            res.json({
              success: true,
              nodeName: nodeProps.nodeName,
              skipped: true,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            return;
          case 'stop':
            throw error;
          default:
            throw error;
        }
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to open URL',
      });
    }
  }

  async click(req: Request, res: Response) {
    try {
      const nodeProps: ClickNodeProperties = req.body;
      
      if (!nodeProps.selector) {
        return res.status(400).json({
          success: false,
          error: 'Selector is required'
        });
      }

      const page = await this.initBrowser();

      try {
        if (nodeProps.waitForElement) {
          await page.waitForSelector(nodeProps.selector, { timeout: nodeProps.timeout });
        }

        // Map our click types to Playwright's button types
        const buttonType = nodeProps.clickType === 'right' ? 'right' : 'left';
        const clickCount = nodeProps.clickType === 'double' ? 2 : 1;

        await page.click(nodeProps.selector, {
          button: buttonType,
          clickCount
        });

        res.json({
          success: true,
          nodeName: nodeProps.nodeName
        });
      } catch (error) {
        switch (nodeProps.errorHandling) {
          case 'retry':
            throw error;
          case 'skip':
            res.json({
              success: true,
              nodeName: nodeProps.nodeName,
              skipped: true,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            return;
          case 'stop':
            throw error;
          default:
            throw error;
        }
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to click element',
      });
    }
  }

  async input(req: Request, res: Response) {
    try {
      const nodeProps: InputNodeProperties = req.body;
      
      if (!nodeProps.selector || !nodeProps.value) {
        return res.status(400).json({
          success: false,
          error: 'Selector and value are required'
        });
      }

      const page = await this.initBrowser();

      try {
        await page.waitForSelector(nodeProps.selector, { timeout: nodeProps.timeout });
        
        if (nodeProps.clearBeforeInput) {
          await page.fill(nodeProps.selector, '');
        }
        
        if (nodeProps.inputType === 'password') {
          await page.type(nodeProps.selector, nodeProps.value, { delay: 100 });
        } else if (nodeProps.inputType === 'file') {
          await page.setInputFiles(nodeProps.selector, nodeProps.value);
        } else {
          await page.type(nodeProps.selector, nodeProps.value);
        }

        res.json({
          success: true,
          nodeName: nodeProps.nodeName
        });
      } catch (error) {
        switch (nodeProps.errorHandling) {
          case 'retry':
            throw error;
          case 'skip':
            res.json({
              success: true,
              nodeName: nodeProps.nodeName,
              skipped: true,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            return;
          case 'stop':
            throw error;
          default:
            throw error;
        }
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to input text',
      });
    }
  }

  async submit(req: Request, res: Response) {
    try {
      const nodeProps: SubmitNodeProperties = req.body;
      
      if (!nodeProps.selector) {
        return res.status(400).json({
          success: false,
          error: 'Selector is required'
        });
      }

      const page = await this.initBrowser();

      try {
        await page.waitForSelector(nodeProps.selector, { timeout: nodeProps.timeout });

        if (nodeProps.waitForNavigation) {
          await Promise.all([
            page.waitForNavigation({ timeout: nodeProps.timeout }),
            page.click(nodeProps.selector),
          ]);
        } else {
          await page.click(nodeProps.selector);
        }

        res.json({
          success: true,
          nodeName: nodeProps.nodeName
        });
      } catch (error) {
        switch (nodeProps.errorHandling) {
          case 'retry':
            throw error;
          case 'skip':
            res.json({
              success: true,
              nodeName: nodeProps.nodeName,
              skipped: true,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            return;
          case 'stop':
            throw error;
          default:
            throw error;
        }
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit form',
      });
    }
  }

  async wait(req: Request, res: Response) {
    try {
      const nodeProps: WaitNodeProperties = req.body;
      
      if (!nodeProps.waitType) {
        return res.status(400).json({
          success: false,
          error: 'Wait type is required'
        });
      }

      const page = await this.initBrowser();

      try {
        if (nodeProps.waitType === 'fixed') {
          await page.waitForTimeout(nodeProps.timeout);
        } else {
          // For dynamic wait, we'll wait for network idle
          await page.waitForLoadState('networkidle', { timeout: nodeProps.timeout });
        }

        res.json({
          success: true,
          nodeName: nodeProps.nodeName
        });
      } catch (error) {
        switch (nodeProps.errorHandling) {
          case 'retry':
            throw error;
          case 'skip':
            res.json({
              success: true,
              nodeName: nodeProps.nodeName,
              skipped: true,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            return;
          case 'stop':
            throw error;
          default:
            throw error;
        }
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to wait',
      });
    }
  }

  async condition(req: Request, res: Response) {
    try {
      const nodeProps: ConditionNodeProperties = req.body;
      
      if (!nodeProps.targetVariable && !nodeProps.selector) {
        return res.status(400).json({
          success: false,
          error: 'Either targetVariable or selector is required'
        });
      }

      const page = await this.initBrowser();
      let conditionMet = false;

      try {
        if (nodeProps.selector) {
          await page.waitForSelector(nodeProps.selector, { timeout: nodeProps.timeout });
        }

        switch (nodeProps.conditionType) {
          case 'exists':
            conditionMet = nodeProps.selector ? await page.isVisible(nodeProps.selector) : false;
            break;
          case 'equals':
            if (nodeProps.selector) {
              const text = await page.textContent(nodeProps.selector);
              conditionMet = text === nodeProps.targetVariable;
            } else {
              conditionMet = nodeProps.targetVariable === 'true';
            }
            break;
          case 'contains':
            if (nodeProps.selector) {
              const text = await page.textContent(nodeProps.selector);
              conditionMet = text?.includes(nodeProps.targetVariable) ?? false;
            } else {
              conditionMet = nodeProps.targetVariable.includes('true');
            }
            break;
        }

        res.json({
          success: true,
          nodeName: nodeProps.nodeName,
          conditionMet,
          nextPath: conditionMet ? nodeProps.truePath : nodeProps.falsePath
        });
      } catch (error) {
        switch (nodeProps.errorHandling) {
          case 'retry':
            throw error;
          case 'skip':
            res.json({
              success: true,
              nodeName: nodeProps.nodeName,
              skipped: true,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            return;
          case 'stop':
            throw error;
          default:
            throw error;
        }
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to evaluate condition',
      });
    }
  }

  async extract(req: Request, res: Response) {
    try {
      const nodeProps: ExtractNodeProperties = req.body;
      
      if (!nodeProps.selector || !nodeProps.attribute || !nodeProps.variableName) {
        return res.status(400).json({
          success: false,
          error: 'Selector, attribute, and variableName are required'
        });
      }

      const page = await this.initBrowser();

      try {
        await page.waitForSelector(nodeProps.selector, { timeout: nodeProps.timeout });
        const value = await page.getAttribute(nodeProps.selector, nodeProps.attribute);

        res.json({
          success: true,
          nodeName: nodeProps.nodeName,
          variableName: nodeProps.variableName,
          value
        });
      } catch (error) {
        switch (nodeProps.errorHandling) {
          case 'retry':
            throw error;
          case 'skip':
            res.json({
              success: true,
              nodeName: nodeProps.nodeName,
              skipped: true,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            return;
          case 'stop':
            throw error;
          default:
            throw error;
        }
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extract data',
      });
    }
  }

  async loop(req: Request, res: Response) {
    try {
      const nodeProps: LoopNodeProperties = req.body;
      
      if (!nodeProps.breakCondition && nodeProps.loopType === 'fixed') {
        return res.status(400).json({
          success: false,
          error: 'breakCondition is required for fixed loop type'
        });
      }

      const page = await this.initBrowser();
      let iterations = 0;

      try {
        while (iterations < nodeProps.maxIterations) {
          if (nodeProps.breakCondition) {
            const shouldBreak = await page.evaluate(nodeProps.breakCondition);
            if (shouldBreak) break;
          }

          res.json({
            success: true,
            nodeName: nodeProps.nodeName,
            currentIteration: iterations + 1,
            maxIterations: nodeProps.maxIterations
          });

          iterations++;
          await page.waitForTimeout(100); // Small delay between iterations
        }

        res.json({
          success: true,
          nodeName: nodeProps.nodeName,
          completed: true,
          totalIterations: iterations
        });
      } catch (error) {
        switch (nodeProps.errorHandling) {
          case 'retry':
            throw error;
          case 'skip':
            res.json({
              success: true,
              nodeName: nodeProps.nodeName,
              skipped: true,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            return;
          case 'stop':
            throw error;
          default:
            throw error;
        }
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute loop',
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