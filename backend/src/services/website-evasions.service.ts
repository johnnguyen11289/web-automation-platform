import { Page } from 'playwright';

export class WebsiteEvasionsService {
  private static instance: WebsiteEvasionsService | null = null;
  private evasions: Record<string, (page: Page) => Promise<void>> = {
    'facebook.com': async (page: Page) => {
      await page.addInitScript(() => {
        Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: false });
        Object.defineProperty(document, 'hidden', { value: false, writable: false });
        Object.defineProperty(navigator, 'connection', {
          get: () => ({
            effectiveType: '4g',
            rtt: 50,
            downlink: 10,
            saveData: false
          })
        });
        // Add Facebook-specific evasions
        Object.defineProperty(window, 'FB', {
          get: () => undefined,
          set: () => true
        });
        Object.defineProperty(document, 'fb_dtsg', {
          get: () => undefined,
          set: () => true
        });
      });
    },
    'google.com': async (page: Page) => {
      await page.addInitScript(() => {
        // Override scheduling APIs
        Object.defineProperty(window, 'requestIdleCallback', {
          value: (cb: Function) => setTimeout(cb, 1)
        });
        // Add Chrome-specific APIs
        Object.defineProperty(navigator, 'userAgentData', {
          get: () => ({
            brands: [
              { brand: 'Chromium', version: '122' },
              { brand: 'Google Chrome', version: '122' },
              { brand: 'Not(A:Brand', version: '24' }
            ],
            mobile: false,
            platform: 'Windows'
          })
        });
        // Add reCAPTCHA evasion
        Object.defineProperty(window, 'grecaptcha', {
          get: () => ({
            ready: (cb: Function) => cb(),
            execute: () => Promise.resolve('fake-token'),
            render: () => 'fake-widget-id'
          })
        });
      });
    },
    'linkedin.com': async (page: Page) => {
      await page.addInitScript(() => {
        // Override performance API
        const originalGetEntries = Performance.prototype.getEntries;
        Performance.prototype.getEntries = function(this: Performance) {
          const entries = originalGetEntries.call(this);
          return entries.filter((entry: PerformanceEntry) => !entry.name.includes('automation'));
        };
        // Add LinkedIn-specific evasions
        Object.defineProperty(window, 'li_at', {
          get: () => undefined,
          set: () => true
        });
      });
    },
    'amazon.com': async (page: Page) => {
      await page.addInitScript(() => {
        // Override canvas fingerprinting
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(
          this: HTMLCanvasElement,
          contextId: "2d" | "webgl" | "bitmaprenderer",
          options?: any
        ): RenderingContext | null {
          const context = originalGetContext.call(this, contextId, options) as RenderingContext;
          if (context && contextId === '2d' && 'measureText' in context) {
            const ctx2d = context as CanvasRenderingContext2D;
            const originalMeasureText = ctx2d.measureText.bind(ctx2d);
            ctx2d.measureText = function(text: string) {
              const metrics = originalMeasureText(text);
              const newMetrics = Object.create(metrics);
              Object.defineProperty(newMetrics, 'width', {
                value: metrics.width * (1 + Math.random() * 0.02),
                enumerable: true
              });
              return newMetrics;
            };
          }
          return context;
        } as typeof HTMLCanvasElement.prototype.getContext;
        // Add Amazon-specific evasions
        Object.defineProperty(window, 'CardinalCommerce', {
          get: () => undefined,
          set: () => true
        });
      });
    },
    'twitter.com': async (page: Page) => {
      await page.addInitScript(() => {
        // Override timing APIs
        const originalNow = performance.now;
        performance.now = function() {
          return originalNow.call(this) + (Math.random() * 10);
        };
        // Add Twitter-specific evasions
        Object.defineProperty(window, '__INITIAL_STATE__', {
          get: () => undefined,
          set: () => true
        });
      });
    },
    'instagram.com': async (page: Page) => {
      await page.addInitScript(() => {
        // Override storage APIs
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key: string, value: string) {
          if (key.includes('ig_')) return;
          return originalSetItem.call(this, key, value);
        };
      });
    }
  };

  public static getInstance(): WebsiteEvasionsService {
    if (!WebsiteEvasionsService.instance) {
      WebsiteEvasionsService.instance = new WebsiteEvasionsService();
    }
    return WebsiteEvasionsService.instance;
  }

  public async applyEvasions(page: Page): Promise<void> {
    const url = page.url();
    for (const [domain, evasion] of Object.entries(this.evasions)) {
      if (url.includes(domain)) {
        await evasion(page);
        console.log(`Applied specific evasion for ${domain}`);
      }
    }
  }

  public addEvasions(domain: string, evasion: (page: Page) => Promise<void>): void {
    this.evasions[domain] = evasion;
  }
} 