import { Page } from 'puppeteer';

export class PuppeteerAntiDetectionService {
  private static instance: PuppeteerAntiDetectionService | null = null;

  public static getInstance(): PuppeteerAntiDetectionService {
    if (!PuppeteerAntiDetectionService.instance) {
      PuppeteerAntiDetectionService.instance = new PuppeteerAntiDetectionService();
    }
    return PuppeteerAntiDetectionService.instance;
  }

  public async applyAntiDetection(page: Page): Promise<void> {
    await this.injectCoreEvasions(page);
    await this.injectWebDriverEvasions(page);
    await this.injectNavigatorEvasions(page);
    await this.injectPerformanceEvasions(page);
    await this.injectCanvasEvasions(page);
    await this.injectStorageEvasions(page);
    await this.injectNetworkEvasions(page);
    await this.injectScreenEvasions(page);
    await this.injectHardwareEvasions(page);
  }

  private async injectCoreEvasions(page: Page): Promise<void> {
    await page.evaluateOnNewDocument(() => {
      // Override common automation flags
      Object.defineProperty(window, 'chrome', {
        get: () => ({
          runtime: {},
          loadTimes: () => {},
          csi: () => {},
          app: {}
        })
      });

      // Override common detection methods
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters: PermissionDescriptor) => {
        if (parameters.name === 'notifications') {
          return Promise.resolve({
            name: 'notifications',
            state: Notification.permission,
            onchange: null,
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => true
          } as PermissionStatus);
        }
        return originalQuery(parameters);
      };
    });
  }

  private async injectWebDriverEvasions(page: Page): Promise<void> {
    await page.evaluateOnNewDocument(() => {
      // Override webdriver flag
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });

      // Override automation flags
      Object.defineProperty(navigator, 'automation', {
        get: () => undefined
      });

      // Override selenium flags
      Object.defineProperty(navigator, 'selenium', {
        get: () => undefined
      });

      // Override Puppeteer specific flags
      Object.defineProperty(navigator, 'puppeteer', {
        get: () => undefined
      });
    });
  }

  private async injectNavigatorEvasions(page: Page): Promise<void> {
    await page.evaluateOnNewDocument(() => {
      const userAgent = navigator.userAgent;
      const platform = navigator.platform;
      const vendor = navigator.vendor;

      // Override navigator properties
      Object.defineProperties(navigator, {
        userAgent: {
          get: () => userAgent.replace(/Headless/, '')
        },
        platform: {
          get: () => platform
        },
        vendor: {
          get: () => vendor
        },
        languages: {
          get: () => ['en-US', 'en']
        },
        plugins: {
          get: () => [
            {
              0: {type: "application/x-google-chrome-pdf"},
              description: "Portable Document Format",
              filename: "internal-pdf-viewer",
              length: 1,
              name: "Chrome PDF Plugin"
            }
          ]
        },
        mimeTypes: {
          get: () => [
            {
              description: "Portable Document Format",
              suffixes: "pdf",
              type: "application/x-google-chrome-pdf"
            }
          ]
        }
      });
    });
  }

  private async injectPerformanceEvasions(page: Page): Promise<void> {
    await page.evaluateOnNewDocument(() => {
      // Override performance timing
      const originalGetEntries = Performance.prototype.getEntries;
      Performance.prototype.getEntries = function(this: Performance) {
        const entries = originalGetEntries.call(this);
        return entries.filter((entry: PerformanceEntry) => 
          !entry.name.includes('automation') && 
          !entry.name.includes('selenium') &&
          !entry.name.includes('webdriver') &&
          !entry.name.includes('puppeteer')
        );
      };

      // Override performance.now
      const originalNow = performance.now;
      performance.now = function() {
        return originalNow.call(this) + (Math.random() * 10);
      };
    });
  }

  private async injectCanvasEvasions(page: Page): Promise<void> {
    await page.evaluateOnNewDocument(() => {
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
    });
  }

  private async injectStorageEvasions(page: Page): Promise<void> {
    await page.evaluateOnNewDocument(() => {
      // Override storage APIs
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function(key: string, value: string) {
        if (key.includes('selenium') || key.includes('webdriver') || key.includes('puppeteer')) return;
        return originalSetItem.call(this, key, value);
      };

      const originalGetItem = localStorage.getItem;
      localStorage.getItem = function(key: string): string | null {
        if (key.includes('selenium') || key.includes('webdriver') || key.includes('puppeteer')) return null;
        return originalGetItem.call(this, key);
      };
    });
  }

  private async injectNetworkEvasions(page: Page): Promise<void> {
    await page.evaluateOnNewDocument(() => {
      // Override network information
      Object.defineProperty(navigator, 'connection', {
        get: () => ({
          effectiveType: '4g',
          rtt: 50,
          downlink: 10,
          saveData: false
        })
      });

      // Override WebRTC
      if (navigator.mediaDevices) {
        const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
        navigator.mediaDevices.getUserMedia = function(constraints) {
          return Promise.reject(new Error('Permission denied'));
        };
      }
    });
  }

  private async injectScreenEvasions(page: Page): Promise<void> {
    await page.evaluateOnNewDocument(() => {
      // Override screen properties
      const screen = window.screen;
      Object.defineProperties(screen, {
        width: { get: () => 1920 },
        height: { get: () => 1080 },
        availWidth: { get: () => 1920 },
        availHeight: { get: () => 1040 },
        colorDepth: { get: () => 24 },
        pixelDepth: { get: () => 24 },
        orientation: {
          get: () => ({
            type: 'landscape-primary',
            angle: 0
          })
        }
      });
    });
  }

  private async injectHardwareEvasions(page: Page): Promise<void> {
    await page.evaluateOnNewDocument(() => {
      // Override hardware information
      Object.defineProperties(navigator, {
        hardwareConcurrency: { get: () => 8 },
        deviceMemory: { get: () => 8 },
        maxTouchPoints: { get: () => 0 },
        platform: { get: () => 'Win32' },
        oscpu: { get: () => 'Windows NT 10.0; Win64; x64' }
      });

      // Override battery information
      Object.defineProperty(navigator, 'getBattery', {
        get: () => () => Promise.resolve({
          charging: true,
          chargingTime: 0,
          dischargingTime: Infinity,
          level: 1
        })
      });
    });
  }
} 