export type BrowserType = 'chromium' | 'firefox' | 'webkit';

export interface ProxySettings {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

export interface ViewportSettings {
  width: number;
  height: number;
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
}

export interface BrowserProfile {
  _id: string;
  name: string;
  browserType: BrowserType;
  userAgent?: string;
  isHeadless: boolean;
  proxy?: ProxySettings;
  viewport: ViewportSettings;
  cookies: any[];
  localStorage: Record<string, any>;
  sessionStorage: Record<string, any>;
  startupScript?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_VIEWPORT: ViewportSettings = {
  width: 1920,
  height: 1080,
  deviceScaleFactor: 1,
  isMobile: false,
  hasTouch: false,
};

export const BROWSER_TYPES: { value: BrowserType; label: string }[] = [
  { value: 'chromium', label: 'Chromium' },
  { value: 'firefox', label: 'Firefox' },
  { value: 'webkit', label: 'WebKit' },
]; 