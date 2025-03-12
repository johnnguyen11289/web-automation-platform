import { chromium, firefox, webkit, Browser, Page, BrowserContext } from 'playwright';
import { BrowserProfile } from '../types/browser.types';
import * as path from 'path';
import * as os from 'os';

// Add at the top of the file, after imports
interface FingerPrintOptions {
  screen?: {
    width: number;
    height: number;
    availWidth: number;
    availHeight: number;
    colorDepth: number;
    pixelDepth: number;
  };
  userAgent?: string;
  webgl?: {
    vendor: string;
    renderer: string;
  };
  cpu?: {
    architecture: string;
    cores: number;
  };
  memory?: {
    deviceMemory: number;
    jsHeapSizeLimit: number;
  };
  platform?: string;
  plugins?: Array<{ name: string; description: string; filename: string }>;
}

// Add utility functions for fingerprint randomization
const getRandomFingerprint = (): FingerPrintOptions => {
  const screenSizes = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
    { width: 1280, height: 720 }
  ];
  
  const webglVendors = [
    { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0)' },
    { vendor: 'Google Inc. (AMD)', renderer: 'ANGLE (AMD, AMD Radeon RX 580 Direct3D11 vs_5_0 ps_5_0)' },
    { vendor: 'Google Inc. (Intel)', renderer: 'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0)' }
  ];

  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Edg/122.0.2365.92'
  ];

  const screen = screenSizes[Math.floor(Math.random() * screenSizes.length)];
  const webgl = webglVendors[Math.floor(Math.random() * webglVendors.length)];

  return {
    screen: {
      ...screen,
      availWidth: screen.width - Math.floor(Math.random() * 50),
      availHeight: screen.height - Math.floor(Math.random() * 100),
      colorDepth: 24,
      pixelDepth: 24
    },
    userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
    webgl,
    cpu: {
      architecture: 'x86-64',
      cores: [4, 6, 8, 12, 16][Math.floor(Math.random() * 5)]
    },
    memory: {
      deviceMemory: [4, 8, 16][Math.floor(Math.random() * 3)],
      jsHeapSizeLimit: 2 ** 31
    },
    platform: 'Win32',
    plugins: [
      { name: 'Chrome PDF Plugin', description: 'Portable Document Format', filename: 'internal-pdf-viewer' },
      { name: 'Chrome PDF Viewer', description: '', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
      { name: 'Native Client', description: '', filename: 'internal-nacl-plugin' }
    ]
  };
};

// Add website-specific evasion techniques
const websiteSpecificEvasions: Record<string, (page: Page) => Promise<void>> = {
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
    });
  }
};

// Add utility functions for human-like behavior
const randomDelay = async (page: Page, min = 100, max = 300) => {
  const delay = Math.floor(Math.random() * (max - min) + min);
  await page.waitForTimeout(delay);
};

const humanMove = async (page: Page, selector: string) => {
  const element = await page.$(selector);
  if (!element) return;
  
  const box = await element.boundingBox();
  if (!box) return;

  // Random start position
  const startX = Math.random() * page.viewportSize()!.width;
  const startY = Math.random() * page.viewportSize()!.height;

  // Move to element with human-like curve
  await page.mouse.move(startX, startY);
  const steps = Math.floor(Math.random() * 10) + 5;
  
  for (let i = 0; i < steps; i++) {
    const x = startX + (box.x + box.width/2 - startX) * (i/steps);
    const y = startY + (box.y + box.height/2 - startY) * (i/steps);
    // Add some random "shake" to the movement
    const offsetX = (Math.random() - 0.5) * 20;
    const offsetY = (Math.random() - 0.5) * 20;
    await page.mouse.move(x + offsetX, y + offsetY, { steps: 1 });
    await randomDelay(page, 20, 50);
  }
};

const humanType = async (page: Page, selector: string, text: string) => {
  await page.focus(selector);
  for (const char of text) {
    await page.keyboard.type(char, {
      delay: Math.random() * 100 + 30
    });
  }
};

export class AutomationService {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private currentProfile: BrowserProfile | null = null;
  private currentPage: Page | null = null;
  private static browsersInstalled = false;
  private static instance: AutomationService | null = null;

  // Singleton pattern to ensure single instance
  public static getInstance(): AutomationService {
    if (!AutomationService.instance) {
      AutomationService.instance = new AutomationService();
    }
    return AutomationService.instance;
  }

  // Private constructor to enforce singleton
  private constructor() {
    // Handle process termination
    process.on('SIGTERM', () => this.cleanup());
    process.on('SIGINT', () => this.cleanup());
    process.on('exit', () => this.cleanup());
  }

  private async cleanup() {
    console.log('Cleaning up browser resources...');
    await this.close();
    AutomationService.browsersInstalled = false;
    AutomationService.instance = null;
  }

  async init() {
    try {
      // Check if browser is already installed in the correct location
      const installPath = 'C:\\Users\\John\\AppData\\Local\\ms-playwright';
      const chromePath = path.join(installPath, 'chromium-1161', 'chrome-win', 'chrome.exe');
      
      const isChromiumInstalled = (() => {
        try {
          return require('fs').existsSync(chromePath);
        } catch (e) {
          return false;
        }
      })();

      if (!isChromiumInstalled) {
        console.log('Browser not found, installing browser binaries...');
        const { execSync } = require('child_process');
        
        // Force the Windows installation path
        process.env.PLAYWRIGHT_BROWSERS_PATH = installPath;
        
        console.log('Installing browsers to:', installPath);
        
        // Only install if not already present
        execSync('npx playwright install chromium', { stdio: 'inherit' });
        console.log('Browser binaries installed successfully');
      } else {
        console.log('Using existing browser installation at:', chromePath);
        process.env.PLAYWRIGHT_BROWSERS_PATH = installPath;
      }

      AutomationService.browsersInstalled = true;

      // Browser will be initialized when profile is applied
      this.browser = null;
      this.context = null;
    } catch (error) {
      console.error('Failed to initialize automation service:', error);
      throw new Error('Failed to initialize automation service: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async close() {
    try {
      if (this.currentPage && !this.currentPage.isClosed()) {
        await this.currentPage.close().catch(() => {});
      }
      this.currentPage = null;

      if (this.context) {
        // Safely close all pages first
        const pages = this.context.pages();
        for (const page of pages) {
          if (!page.isClosed()) {
            await page.close().catch(() => {});
          }
        }
        await this.context.close().catch(() => {});
      }
      this.context = null;

      if (this.browser) {
        await this.browser.close().catch(() => {});
      }
      this.browser = null;
    } catch (error) {
      console.log('Error during cleanup, but continuing:', error);
    }
    this.currentProfile = null;
  }

  async applyProfile(profile: BrowserProfile) {
    try {
      console.log('Applying browser profile:', {
        name: profile.name,
        id: profile._id,
        browserType: profile.browserType,
        isHeadless: profile.isHeadless,
        userAgent: profile.userAgent?.substring(0, 50) + '...',
        hasProxy: !!profile.proxy,
        viewport: profile.viewport
      });

      // Check if we can reuse both browser and context
      const canReuseContext = this.context && 
        this.currentProfile?.browserType === profile.browserType &&
        this.currentProfile?.isHeadless === profile.isHeadless &&
        this.currentProfile?.viewport?.width === profile.viewport?.width &&
        this.currentProfile?.viewport?.height === profile.viewport?.height &&
        this.currentProfile?.userAgent === profile.userAgent &&
        JSON.stringify(this.currentProfile?.proxy) === JSON.stringify(profile.proxy);

      if (!canReuseContext) {
        await this.close();

        const browserType = {
          chromium: chromium,
          firefox: firefox,
          webkit: webkit
        }[profile.browserType];

        if (!browserType) {
          throw new Error(`Unsupported browser type: ${profile.browserType}`);
        }

        const installPath = 'C:\\Users\\John\\AppData\\Local\\ms-playwright';
        const executablePath = process.platform === 'win32' 
          ? path.join(installPath, 'chromium-1161', 'chrome-win', 'chrome.exe')
          : undefined;

        const userDataDir = path.join(installPath, 'user-data-dirs', `profile-${profile._id}`);
        
        if (!require('fs').existsSync(userDataDir)) {
          require('fs').mkdirSync(userDataDir, { recursive: true });
        }

        // Enhanced context options with advanced anti-detection
        const contextOptions: any = {
          viewport: profile.viewport || { width: 1920, height: 1080 },
          userAgent: profile.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          headless: false,
          deviceScaleFactor: 1,
          isMobile: false,
          hasTouch: false,
          locale: 'en-US',
          timezoneId: 'America/New_York',
          geolocation: { longitude: 40.7128, latitude: -74.0060 },
          permissions: ['geolocation'],
          colorScheme: 'light',
          reducedMotion: 'no-preference',
          forcedColors: 'none',
          acceptDownloads: true,
          args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-site-isolation-trials',
            '--disable-features=BlockInsecurePrivateNetworkRequests',
            '--disable-web-security',
            '--disable-gpu',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-infobars',
            '--window-position=0,0',
            '--ignore-certifcate-errors',
            '--ignore-certifcate-errors-spki-list',
            '--disable-accelerated-2d-canvas',
            '--hide-scrollbars',
            '--disable-notifications',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-breakpad',
            '--disable-component-extensions-with-background-pages',
            '--disable-extensions',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--disable-renderer-backgrounding',
            '--enable-features=NetworkService,NetworkServiceInProcess',
            '--force-color-profile=srgb',
            '--metrics-recording-only',
            '--no-first-run',
            '--password-store=basic',
            '--use-mock-keychain',
            '--start-maximized'
          ],
          ignoreDefaultArgs: [
            '--enable-automation',
            '--enable-blink-features=AutomationControlled',
            '--headless',
            '--hide-scrollbars',
            '--mute-audio'
          ],
          executablePath: executablePath
        };

        // Add proxy configuration if provided
        if (profile.proxy?.host && profile.proxy?.port) {
          const proxyProtocol = profile.proxy.host.startsWith('http://') || profile.proxy.host.startsWith('https://') 
            ? '' 
            : 'http://';
          const proxyHost = profile.proxy.host.replace(/^https?:\/\//, '');
          const proxyUrl = `${proxyProtocol}${proxyHost}:${profile.proxy.port}`;

          contextOptions.proxy = {
            server: proxyUrl,
            ...(profile.proxy.username && { username: profile.proxy.username }),
            ...(profile.proxy.password && { password: profile.proxy.password }),
            bypass: 'localhost,127.0.0.1'
          };
        }

        // Launch persistent context with enhanced options
        this.context = await browserType.launchPersistentContext(userDataDir, contextOptions);

        // Add anti-detection scripts
        const pages = this.context.pages();
        for (const page of pages) {
          await this.injectAntiDetection(page);
        }

        // Listen for new pages to inject anti-detection
        this.context.on('page', async (page) => {
          await this.injectAntiDetection(page);
        });

        if (profile.cookies?.length) {
          await this.context.addCookies(profile.cookies);
        }

        if (profile.startupScript) {
          const page = await this.context.newPage();
          await page.evaluate(profile.startupScript);
          await page.close();
        }
      }

      this.currentProfile = profile;
      console.log('Profile applied successfully:', profile.name);
    } catch (error) {
      console.error('Failed to apply profile:', error);
      await this.close();
      throw error;
    }
  }

  private async getPage(): Promise<Page> {
    if (!this.context) {
      throw new Error('Browser context not initialized. Did you call applyProfile?');
    }
    if (!this.currentPage || this.currentPage.isClosed()) {
      console.log('Creating new page...');
      this.currentPage = await this.context.newPage();
    } else {
      console.log('Reusing existing page');
    }
    return this.currentPage;
  }

  async performWebAutomation(url: string | null, actions: AutomationAction[]): Promise<AutomationResult> {
    const page = await this.getPage();
    const results: AutomationStepResult[] = [];
    let success = true;
    let extractedData: Record<string, any> = {};  // Define extractedData object

    try {
      if (url) {
        await page.goto(url, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        await randomDelay(page, 1000, 2000);
      }

      for (const action of actions) {
        try {
          switch (action.type) {
            case 'click':
              if (action.selector) {
                await humanMove(page, action.selector);
                await randomDelay(page, 200, 500);
                await page.click(action.selector, { 
                  button: action.button || 'left',
                  clickCount: action.clickCount || 1,
                  delay: action.delay || Math.floor(Math.random() * 100) + 50
                });
              }
              break;
            case 'type':
              if (action.selector && action.value) {
                await humanMove(page, action.selector);
                await randomDelay(page, 200, 500);
                if (action.clearFirst) {
                  await page.click(action.selector, { clickCount: 3 });
                  await page.keyboard.press('Backspace');
                }
                await humanType(page, action.selector, action.value);
              }
              break;
            case 'screenshot':
              const screenshotPath = action.value || `screenshot-${Date.now()}.png`;
              await page.screenshot({ path: screenshotPath });
              break;
            case 'wait':
              if (action.condition === 'networkIdle') {
                await page.waitForLoadState('networkidle');
              } else if (action.condition === 'delay' && action.delay) {
                await page.waitForTimeout(action.delay);
              } else if (action.selector) {
                await page.waitForSelector(action.selector, {
                  timeout: action.timeout
                });
              } else {
                throw new Error('Invalid wait action configuration');
              }
              break;
            case 'extract':
              if (!action.selector) {
                throw new Error('Selector is required for extract action');
              }
              let extractedValue: string | null = null;
              if (action.attribute === 'text') {
                extractedValue = await page.textContent(action.selector);
              } else if (action.attribute) {
                extractedValue = await page.getAttribute(action.selector, action.attribute);
              } else {
                extractedValue = await page.textContent(action.selector);
              }
              if (action.key) {
                extractedData[action.key] = extractedValue;
              }
              break;
            case 'evaluate':
              if (!action.script) {
                throw new Error('Script is required for evaluate action');
              }
              const result = await page.evaluate(action.script);
              if (action.key) {
                extractedData[action.key] = result;
              }
              break;
            case 'keyboard':
              if (!action.key) {
                throw new Error('Key is required for keyboard action');
              }
              await page.keyboard.press(action.key);
              break;
            case 'select':
              if (!action.selector || !action.value) {
                throw new Error('Selector and value are required for select action');
              }
              await page.selectOption(action.selector, action.value);
              break;
            case 'focus':
              if (!action.selector) {
                throw new Error('Selector is required for focus action');
              }
              await page.focus(action.selector);
              break;
            case 'hover':
              if (!action.selector) {
                throw new Error('Selector is required for hover action');
              }
              await page.hover(action.selector);
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
        // Add random delay between actions
        await randomDelay(page, 500, 1500);
      }
    } catch (error) {
      console.error('Automation failed:', error);
      success = false;
    }

    return {
      success,
      results,
      extractedData
    };
  }

  // Modify the injectAntiDetection method in AutomationService class
  private async injectAntiDetection(page: Page) {
    const fingerprint = getRandomFingerprint();
    
    // Apply website-specific evasions
    const url = page.url();
    for (const [domain, evasion] of Object.entries(websiteSpecificEvasions)) {
      if (url.includes(domain)) {
        await evasion(page);
        console.log(`Applied specific evasion for ${domain}`);
      }
    }

    await page.addInitScript((fp: FingerPrintOptions) => {
      // Override property descriptors with randomized fingerprint
      const overridePropertyDescriptor = (obj: any, prop: string, value: any) => {
        try {
          Object.defineProperty(obj, prop, { get: () => value });
        } catch (e) { }
      };

      // Screen properties
      if (fp.screen) {
        for (const [key, value] of Object.entries(fp.screen)) {
          overridePropertyDescriptor(window.screen, key, value);
        }
      }

      // Navigator properties
      overridePropertyDescriptor(navigator, 'userAgent', fp.userAgent);
      overridePropertyDescriptor(navigator, 'hardwareConcurrency', fp.cpu?.cores);
      overridePropertyDescriptor(navigator, 'deviceMemory', fp.memory?.deviceMemory);
      overridePropertyDescriptor(navigator, 'platform', fp.platform);
      overridePropertyDescriptor(navigator, 'plugins', fp.plugins);

      // WebGL fingerprint
      if (fp.webgl) {
        const getParameterProxyHandler = {
          apply: function(target: Function, thisArg: WebGLRenderingContext, args: [number]) {
            const param = args[0];

            if (param === thisArg.VENDOR && fp.webgl?.vendor) {
              return fp.webgl.vendor;
            }
            if (param === thisArg.RENDERER && fp.webgl?.renderer) {
              return fp.webgl.renderer;
            }

            return Reflect.apply(target, thisArg, args);
          }
        };

        // Override WebGL parameters
        const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = new Proxy(originalGetParameter, getParameterProxyHandler as ProxyHandler<typeof WebGLRenderingContext.prototype.getParameter>);
      }

      // Advanced browser behavior simulation
      const originalRequestAnimationFrame = window.requestAnimationFrame;
      window.requestAnimationFrame = function(callback) {
        const start = performance.now();
        return originalRequestAnimationFrame((timestamp) => {
          // Add small random delay to simulate real browser timing
          const delay = Math.random() * 3;
          setTimeout(() => callback(timestamp + delay), delay);
        });
      };

      // Override performance timing
      const originalGetEntriesByType = Performance.prototype.getEntriesByType;
      Performance.prototype.getEntriesByType = function(type: string) {
        const entries = originalGetEntriesByType.call(this, type);
        if (type === 'navigation') {
          return entries.map(entry => {
            if (entry instanceof PerformanceNavigationTiming) {
              const variation = Math.random() * 50;
              return {
                ...entry,
                domComplete: entry.domComplete + variation,
                loadEventEnd: entry.loadEventEnd + variation
              };
            }
            return entry;
          });
        }
        return entries;
      };

      // Override Permissions with proper type handling
      const originalQuery = window.navigator.permissions.query.bind(window.navigator.permissions);
      window.navigator.permissions.query = (parameters: PermissionDescriptor): Promise<PermissionStatus> => {
        if (parameters.name === 'notifications') {
          return Promise.resolve({
            state: Notification.permission as PermissionState,
            name: parameters.name,
            onchange: null,
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => true
          });
        }
        return originalQuery(parameters);
      };

      // Override Function.prototype methods
      const oldCall = Function.prototype.call;
      function call(this: Function, thisArg: any, ...args: any[]) {
        return oldCall.call(this, thisArg, ...args);
      }
      Function.prototype.call = call;

      const nativeToString = Function.prototype.toString;
      Function.prototype.toString = function(this: Function) {
        if (this === call) {
          return "function call() { [native code] }";
        }
        return nativeToString.call(this);
      };

      // Add timezone and locale consistency
      const dateProto = Object.getPrototypeOf(new Date());
      const originalToTimeString = dateProto.toTimeString;
      dateProto.toTimeString = function() {
        const result = originalToTimeString.call(this);
        return result.replace(/GMT[+-]\d{4}/, 'GMT-0400');
      };

      // Override canvas fingerprinting
      const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function(type?: string, quality?: any) {
        if (this.width === 16 && this.height === 16) {
          // Likely a fingerprinting attempt
          return "data:image/png;base64,RANDOMIZED_STRING";
        }
        return originalToDataURL.call(this, type, quality);
      };
    }, fingerprint);

    // Add custom error handlers with randomized delays
    await page.route('**/*', async (route) => {
      try {
        // Add random delays to requests to appear more human-like
        const delay = Math.floor(Math.random() * 100) + 50;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Modify headers to appear more natural
        const request = route.request();
        const headers = request.headers();
        headers['Accept-Language'] = 'en-US,en;q=0.9';
        headers['sec-ch-ua-platform'] = '"Windows"';
        headers['sec-ch-ua'] = '"Chromium";v="122", "Google Chrome";v="122", "Not(A:Brand";v="24"';
        
        await route.continue({ headers });
      } catch (error) {
        console.error('Error in request interception:', error);
        await route.continue();
      }
    });
  }

  async openProfileForSetup(profile: BrowserProfile): Promise<void> {
    try {
      console.log('Opening profile for manual setup:', profile.name);
      
      // Initialize if needed
      if (!AutomationService.browsersInstalled) {
        await this.init();
      }

      // Close any existing browser instance
      await this.close();

      // Select browser type
      const browserType = {
        chromium: chromium,
        firefox: firefox,
        webkit: webkit
      }[profile.browserType];

      if (!browserType) {
        throw new Error(`Unsupported browser type: ${profile.browserType}`);
      }

      // Set up paths
      const installPath = 'C:\\Users\\John\\AppData\\Local\\ms-playwright';
      const executablePath = process.platform === 'win32' 
        ? path.join(installPath, 'chromium-1161', 'chrome-win', 'chrome.exe')
        : undefined;

      // Create persistent user data directory for this profile
      const userDataDir = path.join(installPath, 'user-data-dirs', `profile-${profile._id}`);
      
      // Ensure the directory exists
      if (!require('fs').existsSync(userDataDir)) {
        require('fs').mkdirSync(userDataDir, { recursive: true });
      }

      console.log('Opening browser for manual setup:', {
        name: profile.name,
        userDataDir: userDataDir
      });

      // Create context options with additional settings to appear more like regular Chrome
      const contextOptions: any = {
        viewport: profile.viewport || null,
        userAgent: profile.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        headless: false,
        args: [
          '--start-maximized',
          '--disable-blink-features=AutomationControlled',
          '--window-size=1920,1080'
        ],
        ignoreDefaultArgs: ['--enable-automation', '--enable-blink-features=AutomationControlled'],
        executablePath: executablePath
      };

      // Add proxy if configured
      if (profile.proxy?.host && profile.proxy?.port) {
        const proxyProtocol = profile.proxy.host.startsWith('http://') || profile.proxy.host.startsWith('https://') 
          ? '' 
          : 'http://';
        const proxyHost = profile.proxy.host.replace(/^https?:\/\//, '');
        const proxyUrl = `${proxyProtocol}${proxyHost}:${profile.proxy.port}`;

        contextOptions.proxy = {
          server: proxyUrl,
          ...(profile.proxy.username && { username: profile.proxy.username }),
          ...(profile.proxy.password && { password: profile.proxy.password })
        };
      }

      // Launch persistent context with modified options
      this.context = await browserType.launchPersistentContext(userDataDir, contextOptions);
      
      // Safely close any existing pages/tabs
      try {
        const pages = this.context.pages();
        for (const page of pages) {
          if (!page.isClosed()) {
            await page.close().catch(() => {});
          }
        }
      } catch (error) {
        console.log('Error closing existing pages, but continuing:', error);
      }
      
      // Open a new page with common login URLs based on profile name
      const page = await this.context.newPage();
      this.currentPage = page;

      // Suggest common login pages based on profile name
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
      console.log('The browser will remain open until you close it or call closeProfileSetup().');
      
      // Store current profile
      this.currentProfile = profile;

    } catch (error) {
      console.error('Failed to open profile for setup:', {
        name: profile.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      await this.close();
      throw error;
    }
  }

  async closeProfileSetup(): Promise<void> {
    console.log('Closing profile setup...');
    await this.close();
    console.log('Profile setup closed. Your login sessions and configurations have been saved.');
  }
}

export interface AutomationAction {
  type: 'click' | 'type' | 'screenshot' | 'wait' | 'extract' | 'evaluate' | 'keyboard' | 'select' | 'focus' | 'hover' | 'openUrl';
  selector?: string;
  value?: string;
  key?: string;
  script?: string;
  button?: 'left' | 'right' | 'middle';
  clickCount?: number;
  delay?: number;
  timeout?: number;
  condition?: 'networkIdle' | 'delay';
  attribute?: string;
  clearFirst?: boolean;
  stopOnError?: boolean;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
}

export interface AutomationStepResult {
  action: AutomationAction;
  success: boolean;
  error?: string;
}

export interface AutomationResult {
  success: boolean;
  results: AutomationStepResult[];
  extractedData: Record<string, any>;
} 