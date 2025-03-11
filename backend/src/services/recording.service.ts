import { Page, BrowserContext } from 'playwright';
import * as path from 'path';

export class RecordingService {
  private static instance: RecordingService | null = null;

  private constructor() {}

  public static getInstance(): RecordingService {
    if (!RecordingService.instance) {
      RecordingService.instance = new RecordingService();
    }
    return RecordingService.instance;
  }

  async setupRecording(context: BrowserContext, profileId: string): Promise<void> {
    // Create recordings directory if it doesn't exist
    const recordingsDir = path.join(process.cwd(), 'recordings');
    if (!require('fs').existsSync(recordingsDir)) {
      require('fs').mkdirSync(recordingsDir, { recursive: true });
    }

    // Start HAR recording
    await context.tracing.start({
      name: `Profile ${profileId} Recording`,
      screenshots: true,
      snapshots: true,
      sources: true
    });

    // Enable Playwright Inspector for debugging and recording
    process.env.PWDEBUG = '1';
  }

  async setupSelectorHelper(page: Page): Promise<void> {
    // Enable recording mode
    await page.evaluate(() => {
      console.log('Recording mode enabled. Use the Playwright Inspector to record actions.');
      console.log('Press "Record" in the Inspector to start recording.');
      console.log('Right-click elements to copy their selectors.');
    });

    // Add helper functions to the page for getting selectors
    await page.evaluate(() => {
      interface ExtendedWindow extends Window {
        getSelector: (element: Element) => string;
      }

      const getSelectorFn = (element: Element): string => {
        const getPath = (el: Element): string => {
          if (!el || !el.parentElement) return '';
          
          const path: string[] = [];
          let current = el;
          
          while (current.parentElement) {
            let selector = current.tagName.toLowerCase();
            
            if (current.id) {
              selector += `#${current.id}`;
              path.unshift(selector);
              break;
            }
            
            if (current.className) {
              const classes = Array.from(current.classList).join('.');
              if (classes) {
                selector += `.${classes}`;
              }
            }
            
            const siblings = Array.from(current.parentElement.children);
            const similarSiblings = siblings.filter(sibling => 
              sibling.tagName === current.tagName
            );
            
            if (similarSiblings.length > 1) {
              const index = similarSiblings.indexOf(current) + 1;
              selector += `:nth-of-type(${index})`;
            }
            
            path.unshift(selector);
            current = current.parentElement;
          }
          
          return path.join(' > ');
        };

        return getPath(element);
      };

      (window as unknown as ExtendedWindow).getSelector = getSelectorFn;

      // Add click handler to copy selectors
      document.addEventListener('contextmenu', (e: MouseEvent) => {
        e.preventDefault();
        const target = e.target as Element;
        const selector = getSelectorFn(target);
        console.log('Selector for clicked element:', selector);
        navigator.clipboard.writeText(selector).then(() => {
          console.log('Selector copied to clipboard!');
        });
      }, true);
    });

    // Add keyboard shortcut to toggle inspector
    await page.keyboard.down('Control');
    await page.keyboard.down('Shift');
    await page.keyboard.press('i');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Control');
  }

  async stopRecording(context: BrowserContext): Promise<void> {
    await context.tracing.stop();
  }
} 