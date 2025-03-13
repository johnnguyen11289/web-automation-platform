import { chromium, firefox, webkit, Browser, Page, BrowserContext } from 'playwright';
import { BrowserProfile } from '../types/browser.types';
import * as path from 'path';
import * as os from 'os';
import { execSync, spawn } from 'child_process';

// Add at the top of the file, after imports
interface FingerPrintOptions {
  screen?: {
    width: number;
    height: number;
    availWidth: number;
    availHeight: number;
    colorDepth: number;
    pixelDepth: number;
    orientation?: {
      type: 'landscape-primary' | 'portrait-primary';
      angle: 0 | 90 | 180 | 270;
    };
  };
  userAgent?: string;
  webgl?: {
    vendor: string;
    renderer: string;
    unmaskedVendor: string;
    unmaskedRenderer: string;
    antialias: boolean;
    extensions: string[];
    parameters: Record<string, any>;
  };
  cpu?: {
    architecture: string;
    cores: number;
    platform: string;
    oscpu: string;
  };
  memory?: {
    deviceMemory: number;
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  };
  battery?: {
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
    level: number;
  };
  network?: {
    effectiveType: '4g' | '3g' | '2g' | 'slow-2g';
    downlink: number;
    rtt: number;
    saveData: boolean;
  };
  platform?: string;
  plugins?: Array<{ name: string; description: string; filename: string }>;
  mediaDevices?: Array<{ kind: string; label: string }>;
  fonts?: string[];
  audio?: {
    sampleRate: number;
    channelCount: number;
    volume: number;
  };
}

// Add utility functions for fingerprint randomization
const getRandomFingerprint = (): FingerPrintOptions => {
  const screenSizes = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
    { width: 2560, height: 1440 },
    { width: 3840, height: 2160 },
    { width: 1680, height: 1050 }
  ];
  
  const webglVendors = [
    {
      vendor: 'Google Inc. (NVIDIA)',
      renderer: 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0)',
      unmaskedVendor: 'NVIDIA Corporation',
      unmaskedRenderer: 'NVIDIA GeForce GTX 1660 SUPER',
      extensions: [
        'ANGLE_instanced_arrays',
        'EXT_blend_minmax',
        'EXT_color_buffer_half_float',
        'EXT_disjoint_timer_query',
        'EXT_float_blend',
        'EXT_frag_depth',
        'EXT_shader_texture_lod',
        'EXT_texture_compression_bptc',
        'EXT_texture_compression_rgtc',
        'EXT_texture_filter_anisotropic',
        'OES_element_index_uint',
        'OES_standard_derivatives',
        'OES_texture_float',
        'OES_texture_float_linear',
        'OES_texture_half_float',
        'OES_texture_half_float_linear',
        'OES_vertex_array_object',
        'WEBGL_color_buffer_float',
        'WEBGL_compressed_texture_s3tc',
        'WEBGL_compressed_texture_s3tc_srgb',
        'WEBGL_debug_renderer_info',
        'WEBGL_debug_shaders',
        'WEBGL_depth_texture',
        'WEBGL_draw_buffers',
        'WEBGL_lose_context',
        'WEBGL_multi_draw'
      ]
    },
    {
      vendor: 'Google Inc. (AMD)',
      renderer: 'ANGLE (AMD, AMD Radeon RX 580 Direct3D11 vs_5_0 ps_5_0)',
      unmaskedVendor: 'AMD',
      unmaskedRenderer: 'AMD Radeon RX 580',
      extensions: [
        'ANGLE_instanced_arrays',
        'EXT_blend_minmax',
        'EXT_color_buffer_half_float',
        'EXT_disjoint_timer_query',
        'EXT_float_blend',
        'EXT_frag_depth',
        'EXT_shader_texture_lod',
        'EXT_texture_compression_bptc',
        'EXT_texture_filter_anisotropic',
        'OES_element_index_uint',
        'OES_standard_derivatives',
        'OES_texture_float',
        'OES_texture_float_linear',
        'OES_texture_half_float',
        'OES_vertex_array_object',
        'WEBGL_color_buffer_float',
        'WEBGL_compressed_texture_s3tc',
        'WEBGL_depth_texture',
        'WEBGL_draw_buffers'
      ]
    },
    {
      vendor: 'Google Inc. (Intel)',
      renderer: 'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0)',
      unmaskedVendor: 'Intel',
      unmaskedRenderer: 'Intel(R) UHD Graphics 630',
      extensions: [
        'ANGLE_instanced_arrays',
        'EXT_blend_minmax',
        'EXT_color_buffer_half_float',
        'EXT_disjoint_timer_query',
        'EXT_float_blend',
        'EXT_frag_depth',
        'EXT_shader_texture_lod',
        'EXT_texture_filter_anisotropic',
        'OES_element_index_uint',
        'OES_standard_derivatives',
        'OES_texture_float',
        'OES_texture_float_linear',
        'OES_texture_half_float',
        'OES_vertex_array_object',
        'WEBGL_color_buffer_float',
        'WEBGL_compressed_texture_s3tc',
        'WEBGL_depth_texture'
      ]
    }
  ];

  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Edg/122.0.2365.92',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 OPR/108.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Vivaldi/6.5.3206.53'
  ];

  const fonts = [
    'Arial', 'Arial Black', 'Arial Narrow', 'Calibri', 'Cambria', 'Cambria Math', 'Comic Sans MS', 'Consolas',
    'Courier', 'Courier New', 'Georgia', 'Helvetica', 'Impact', 'Lucida Console', 'Lucida Sans Unicode',
    'Microsoft Sans Serif', 'MS Gothic', 'MS PGothic', 'Palatino Linotype', 'Segoe UI', 'Tahoma', 'Times',
    'Times New Roman', 'Trebuchet MS', 'Verdana'
  ];

  const mediaDevices = [
    { kind: 'audioinput', label: 'Microphone (Realtek(R) Audio)' },
    { kind: 'audiooutput', label: 'Speakers (Realtek(R) Audio)' },
    { kind: 'videoinput', label: 'HD WebCam (1080p)' }
  ];

  const screen = screenSizes[Math.floor(Math.random() * screenSizes.length)];
  const webgl = webglVendors[Math.floor(Math.random() * webglVendors.length)];
  const selectedFonts = fonts.filter(() => Math.random() > 0.5);

  return {
    screen: {
      ...screen,
      availWidth: screen.width - Math.floor(Math.random() * 50),
      availHeight: screen.height - Math.floor(Math.random() * 100),
      colorDepth: 24,
      pixelDepth: 24,
      orientation: Math.random() > 0.5 ? 
        { type: 'landscape-primary', angle: 0 } :
        { type: 'portrait-primary', angle: 90 }
    },
    userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
    webgl: {
      ...webgl,
      antialias: Math.random() > 0.5,
      parameters: {
        'MAX_COMBINED_TEXTURE_IMAGE_UNITS': 32,
        'MAX_CUBE_MAP_TEXTURE_SIZE': 16384,
        'MAX_FRAGMENT_UNIFORM_VECTORS': 1024,
        'MAX_RENDERBUFFER_SIZE': 16384,
        'MAX_TEXTURE_IMAGE_UNITS': 16,
        'MAX_TEXTURE_SIZE': 16384,
        'MAX_VARYING_VECTORS': 30,
        'MAX_VERTEX_ATTRIBS': 16,
        'MAX_VERTEX_TEXTURE_IMAGE_UNITS': 16,
        'MAX_VERTEX_UNIFORM_VECTORS': 4096,
        'MAX_VIEWPORT_DIMS': [32767, 32767]
      }
    },
    cpu: {
      architecture: 'x86-64',
      cores: [4, 6, 8, 12, 16][Math.floor(Math.random() * 5)],
      platform: 'Win32',
      oscpu: 'Windows NT 10.0; Win64; x64'
    },
    memory: {
      deviceMemory: [4, 8, 16][Math.floor(Math.random() * 3)],
      jsHeapSizeLimit: 2 ** 31,
      totalJSHeapSize: Math.floor(Math.random() * 500000000) + 500000000,
      usedJSHeapSize: Math.floor(Math.random() * 100000000) + 100000000
    },
    battery: {
      charging: Math.random() > 0.3,
      chargingTime: Math.random() > 0.5 ? 0 : Math.floor(Math.random() * 3600),
      dischargingTime: Math.floor(Math.random() * 7200) + 1800,
      level: Math.random()
    },
    network: {
      effectiveType: '4g',
      downlink: Math.floor(Math.random() * 30) + 10,
      rtt: Math.floor(Math.random() * 50) + 50,
      saveData: false
    },
    platform: 'Win32',
    plugins: [
      { name: 'Chrome PDF Plugin', description: 'Portable Document Format', filename: 'internal-pdf-viewer' },
      { name: 'Chrome PDF Viewer', description: '', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
      { name: 'Native Client', description: '', filename: 'internal-nacl-plugin' }
    ],
    mediaDevices: mediaDevices.filter(() => Math.random() > 0.3),
    fonts: selectedFonts,
    audio: {
      sampleRate: [44100, 48000, 96000][Math.floor(Math.random() * 3)],
      channelCount: [2, 4, 6][Math.floor(Math.random() * 3)],
      volume: Math.random()
    }
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

  const viewportSize = page.viewportSize();
  if (!viewportSize) return;

  // Random start position with natural bias towards common areas
  const startX = Math.random() * viewportSize.width;
  const startY = Math.random() * viewportSize.height;

  // Bezier curve control points for natural movement
  const cp1x = startX + (Math.random() - 0.5) * 100;
  const cp1y = startY + (Math.random() - 0.5) * 100;
  const cp2x = box.x + box.width/2 + (Math.random() - 0.5) * 50;
  const cp2y = box.y + box.height/2 + (Math.random() - 0.5) * 50;
  const endX = box.x + box.width/2;
  const endY = box.y + box.height/2;

  // Move mouse with bezier curve
  const steps = Math.floor(Math.random() * 15) + 10;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const t1 = 1 - t;
    
    // Cubic bezier curve calculation
    const x = t1 * t1 * t1 * startX +
             3 * t1 * t1 * t * cp1x +
             3 * t1 * t * t * cp2x +
             t * t * t * endX;
             
    const y = t1 * t1 * t1 * startY +
             3 * t1 * t1 * t * cp1y +
             3 * t1 * t * t * cp2y +
             t * t * t * endY;

    // Add subtle "shake" to movement
    const shake = Math.sin(t * Math.PI * 2) * (1 - t) * 2;
    const offsetX = shake * (Math.random() - 0.5) * 2;
    const offsetY = shake * (Math.random() - 0.5) * 2;

    await page.mouse.move(x + offsetX, y + offsetY);
    
    // Variable delay between movements
    const delay = Math.random() * 20 + 10;
    await page.waitForTimeout(delay);
  }

  // Final precise movement to target
  await page.mouse.move(endX, endY);
};

const humanType = async (page: Page, selector: string, text: string) => {
  await page.focus(selector);
  
  const typingStyles = [
    { minDelay: 50, maxDelay: 200 }, // slow, careful typing
    { minDelay: 30, maxDelay: 100 }, // moderate typing
    { minDelay: 20, maxDelay: 60 }   // fast typing
  ];
  
  const style = typingStyles[Math.floor(Math.random() * typingStyles.length)];
  
  for (let i = 0; i < text.length; i++) {
    // Simulate common typing errors
    if (Math.random() < 0.03) { // 3% chance of typo
      const typo = text[i].replace(/[a-z]/i, String.fromCharCode(97 + Math.floor(Math.random() * 26)));
      await page.keyboard.type(typo);
      await page.waitForTimeout(style.maxDelay);
      await page.keyboard.press('Backspace');
      await page.waitForTimeout(style.maxDelay);
    }
    
    // Simulate natural typing rhythm
    const delay = Math.random() * (style.maxDelay - style.minDelay) + style.minDelay;
    
    // Add slight pause for space or punctuation
    if ([' ', '.', ',', '!', '?'].includes(text[i])) {
      await page.waitForTimeout(delay * 2);
    }
    
    await page.keyboard.type(text[i]);
    await page.waitForTimeout(delay);
    
    // Occasional pause while typing
    if (Math.random() < 0.02) { // 2% chance of pause
      await page.waitForTimeout(Math.random() * 500 + 500);
    }
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

  private async launchLocalChrome(options: any = {}, profile?: BrowserProfile): Promise<Browser> {
    // Find Chrome executable based on the platform
    const chromePath = process.platform === 'win32'
      ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
      : process.platform === 'darwin'
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : '/usr/bin/google-chrome';

    // Get default Chrome user data directory
    const defaultUserDataDir = process.platform === 'win32'
      ? path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\User Data')
      : process.platform === 'darwin'
        ? path.join(os.homedir(), 'Library/Application Support/Google/Chrome')
        : path.join(os.homedir(), '.config/google-chrome');

    // Use provided userDataDir, or default Chrome path, or create a new one
    const userDataDir = profile?.userDataDir || 
      (profile?.useLocalChrome ? defaultUserDataDir : 
        path.join(os.tmpdir(), `chrome-automation-${profile?._id || Date.now()}`));

    console.log('Using Chrome user data directory:', userDataDir);

    return chromium.launch({
      executablePath: chromePath,
      headless: false, // Local Chrome doesn't support new headless mode yet
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials',
        `--user-data-dir=${userDataDir}`
      ],
      ...options
    });
  }

  async init(useLocalChrome: boolean = false, profile?: BrowserProfile) {
    try {
      if (!this.browser) {
        if (useLocalChrome) {
          this.browser = await this.launchLocalChrome({}, profile);
        } else {
          // Original Chromium launch logic
          const installPath = 'C:\\Users\\John\\AppData\\Local\\ms-playwright';
          if (!AutomationService.browsersInstalled) {
            process.env.PLAYWRIGHT_BROWSERS_PATH = installPath;
            console.log('Installing browsers...');
            execSync('npx playwright install chromium', { stdio: 'inherit' });
            AutomationService.browsersInstalled = true;
            process.env.PLAYWRIGHT_BROWSERS_PATH = installPath;
          }
          this.browser = await chromium.launch({
            headless: false
          });
        }
      }

      if (!this.context) {
        this.context = await this.browser.newContext({
          viewport: { width: 1920, height: 1080 },
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      return false;
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
      // Close existing browser and context if they exist
      await this.cleanup();

      // Initialize with local Chrome if specified in the profile
      await this.init(profile.useLocalChrome, profile);

      if (!this.browser) {
        throw new Error('Browser not initialized');
      }

      // Create a new context with the profile settings
      const contextOptions: any = {
        viewport: profile.viewport || { width: 1920, height: 1080 },
        userAgent: profile.userAgent,
        locale: profile.locale || 'en-US',
        timezoneId: profile.timezone || 'America/New_York',
        geolocation: profile.geolocation,
        permissions: profile.permissions || [],
        bypassCSP: true,
      };

      // Add proxy if configured
      if (profile.proxy) {
        contextOptions.proxy = profile.proxy;
      }

      this.context = await this.browser.newContext(contextOptions);
      this.currentProfile = profile;

      // Apply additional configurations
      if (this.context) {
        // Set cookies if provided
        if (profile.cookies && profile.cookies.length > 0) {
          await this.context.addCookies(profile.cookies);
        }

        // Create a new page
        const page = await this.context.newPage();
        this.currentPage = page;

        // Apply anti-detection measures if not using local Chrome
        if (!profile.useLocalChrome) {
          await this.injectAntiDetection(page);
        }

        // Apply any custom JavaScript
        if (profile.customJs) {
          await page.addInitScript(profile.customJs);
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to apply profile:', error);
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

    // Set up fingerprint rotation
    if (shouldRotateFingerprint()) {
      console.log('Rotating browser fingerprint...');
      await this.rotateFingerprint(page);
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

      // Add audio context fingerprint randomization
      const originalGetChannelData = AudioBuffer.prototype.getChannelData;
      AudioBuffer.prototype.getChannelData = function(channel: number) {
        const data = originalGetChannelData.call(this, channel);
        if (data.length > 0) {
          // Add subtle variations to audio data
          const noise = 0.0000001;
          for (let i = 0; i < data.length; i += 100) {
            data[i] = data[i] + (Math.random() * 2 - 1) * noise;
          }
        }
        return data;
      };

      // Add WebRTC protection
      Object.defineProperty(window, 'RTCPeerConnection', {
        value: undefined,
        writable: false
      });

      // Add more sophisticated timing protection
      const timingJitter = () => (Math.random() * 2 - 1) * 0.1;
      
      const originalGetTime = Date.prototype.getTime;
      Date.prototype.getTime = function() {
        return originalGetTime.call(this) + timingJitter();
      };
      
      const originalNow = Date.now;
      Date.now = function() {
        return originalNow() + timingJitter();
      };

      // Add font fingerprint protection
      Object.defineProperty(document, 'fonts', {
        get: () => ({
          ready: Promise.resolve(),
          check: () => Promise.resolve(false),
          load: () => Promise.resolve([])
        })
      });

      // Add hardware concurrency randomization
      let lastConcurrencyCheck = Date.now();
      let currentConcurrency = fp.cpu?.cores || 8;
      
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => {
          const now = Date.now();
          if (now - lastConcurrencyCheck > 10000) { // Change every 10 seconds
            currentConcurrency = [4, 6, 8, 12, 16][Math.floor(Math.random() * 5)];
            lastConcurrencyCheck = now;
          }
          return currentConcurrency;
        }
      });

      // Add dynamic memory reporting
      let lastMemoryCheck = Date.now();
      let currentMemory = {
        jsHeapSizeLimit: fp.memory?.jsHeapSizeLimit || 2147483648,
        totalJSHeapSize: fp.memory?.totalJSHeapSize || 50000000,
        usedJSHeapSize: fp.memory?.usedJSHeapSize || 25000000
      };

      Object.defineProperty(performance, 'memory', {
        get: () => {
          const now = Date.now();
          if (now - lastMemoryCheck > 1000) { // Update every second
            currentMemory.totalJSHeapSize += Math.random() * 1000000 - 500000;
            currentMemory.usedJSHeapSize += Math.random() * 500000 - 250000;
            lastMemoryCheck = now;
          }
          return { ...currentMemory };
        }
      });

    }, fingerprint);

    // Enhanced request interception
    await page.route('**/*', async (route) => {
      try {
        const request = route.request();
        const headers = request.headers();
        
        // Randomize accept headers
        headers['Accept'] = [
          '*/*',
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
        ][Math.floor(Math.random() * 3)];
        
        headers['Accept-Language'] = [
          'en-US,en;q=0.9',
          'en-US,en;q=0.8',
          'en-GB,en;q=0.9,en-US;q=0.8',
          'en-CA,en;q=0.9,fr-CA;q=0.8'
        ][Math.floor(Math.random() * 4)];

        // Add random client hints
        headers['sec-ch-ua-platform'] = '"Windows"';
        headers['sec-ch-ua'] = '"Chromium";v="122", "Google Chrome";v="122", "Not(A:Brand";v="24"';
        headers['sec-ch-ua-mobile'] = '?0';
        headers['sec-fetch-dest'] = ['document', 'empty', 'image'][Math.floor(Math.random() * 3)];
        headers['sec-fetch-mode'] = ['navigate', 'cors', 'no-cors'][Math.floor(Math.random() * 3)];
        headers['sec-fetch-site'] = ['same-origin', 'cross-site', 'same-site'][Math.floor(Math.random() * 3)];

        // Add random delay to requests
        const delay = Math.floor(Math.random() * 100) + 50;
        await new Promise(resolve => setTimeout(resolve, delay));

        await route.continue({ headers });
      } catch (error) {
        console.error('Error in request interception:', error);
        await route.continue();
      }
    });
  }

  // Add method for fingerprint rotation
  private async rotateFingerprint(page: Page) {
    const newFingerprint = getRandomFingerprint();
    await this.injectAntiDetection(page);
    return newFingerprint;
  }

  async openProfileForSetup(profile: BrowserProfile): Promise<void> {
    try {
      console.log('Opening profile for manual setup:', profile.name);

      // Close any existing browser instance
      await this.close();

      if (profile.useLocalChrome && profile.browserType === 'chromium') {
        // Find Chrome executable
        let chromeExecutable;
        if (process.platform === 'win32') {
          const programFiles = process.env['PROGRAMFILES'] || 'C:\\Program Files';
          const programFiles86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
          const possiblePaths = [
            path.join(programFiles, 'Google\\Chrome\\Application\\chrome.exe'),
            path.join(programFiles86, 'Google\\Chrome\\Application\\chrome.exe'),
            path.join(os.homedir(), 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe')
          ];
          
          for (const path of possiblePaths) {
            if (require('fs').existsSync(path)) {
              chromeExecutable = path;
              break;
            }
          }
        } else if (process.platform === 'darwin') {
          chromeExecutable = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        } else {
          chromeExecutable = '/usr/bin/google-chrome';
        }

        if (!chromeExecutable || !require('fs').existsSync(chromeExecutable)) {
          throw new Error('Could not find Google Chrome installation');
        }

        // Set up user data directory
        const defaultUserDataDir = process.platform === 'win32'
          ? path.join(os.homedir(), 'AppData\\Local\\Google\\Chrome\\User Data')
          : process.platform === 'darwin'
            ? path.join(os.homedir(), 'Library/Application Support/Google/Chrome')
            : path.join(os.homedir(), '.config/google-chrome');

        // Use the default Chrome user data directory
        const userDataDir = defaultUserDataDir;

        console.log('Launching Chrome with:', {
          executable: chromeExecutable,
          userDataDir: userDataDir
        });

        // Build Chrome arguments
        const chromeArgs = [
          `--user-data-dir=${userDataDir}`,
          '--no-default-browser-check',
          '--no-first-run',
          '--disable-blink-features=AutomationControlled',
          '--window-size=1920,1080',
          '--start-maximized'
        ];

        // Add proxy settings if configured
        if (profile.proxy?.host && profile.proxy?.port) {
          const proxyUrl = `${profile.proxy.host}:${profile.proxy.port}`;
          chromeArgs.push(`--proxy-server=${proxyUrl}`);
        }

        // Launch Chrome directly
        const chrome = spawn(chromeExecutable, chromeArgs, {
          stdio: 'ignore',
          detached: true
        });

        // Don't wait for Chrome to close
        chrome.unref();

        console.log('Chrome launched successfully');
        return;
      }

      // Fall back to Playwright for non-Chrome browsers
      const browserType = {
        chromium: chromium,
        firefox: firefox,
        webkit: webkit
      }[profile.browserType];

      if (!browserType) {
        throw new Error(`Unsupported browser type: ${profile.browserType}`);
      }

      // For Playwright, use a separate user data directory
      const installPath = process.platform === 'win32' 
        ? path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright')
        : path.join(os.homedir(), '.cache', 'ms-playwright');

      const userDataDir = path.join(installPath, 'user-data-dirs', `profile-${profile._id}`);
      
      if (!require('fs').existsSync(userDataDir)) {
        require('fs').mkdirSync(userDataDir, { recursive: true });
      }

      const contextOptions: any = {
        viewport: profile.viewport || null,
        userAgent: profile.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        headless: false,
        args: [
          '--start-maximized',
          '--disable-blink-features=AutomationControlled',
          '--window-size=1920,1080'
        ],
        ignoreDefaultArgs: ['--enable-automation', '--enable-blink-features=AutomationControlled']
      };

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

      this.context = await browserType.launchPersistentContext(userDataDir, contextOptions);
      
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
      
      const page = await this.context.newPage();
      this.currentPage = page;

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

// Add dynamic fingerprint rotation
let lastFingerprintRotation = Date.now();
const FINGERPRINT_ROTATION_INTERVAL = 1000 * 60 * 30; // 30 minutes

const shouldRotateFingerprint = () => {
  const now = Date.now();
  if (now - lastFingerprintRotation >= FINGERPRINT_ROTATION_INTERVAL) {
    lastFingerprintRotation = now;
    return true;
  }
  return false;
}; 