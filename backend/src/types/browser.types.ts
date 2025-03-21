import { Types } from 'mongoose';

export type BrowserType = 'chromium' | 'firefox' | 'webkit';
export type AutomationLibrary = 'Playwright' | 'Puppeteer';

export interface ViewportSettings {
  width: number;
  height: number;
}

export interface ProxySettings {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

export interface BrowserProfile {
  _id: string | Types.ObjectId;
  name: string;
  browserType: BrowserType;
  automationLibrary: AutomationLibrary;
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
  useLocalChrome?: boolean;
  userDataDir?: string;
  locale?: string;
  timezone?: string;
  geolocation?: { latitude: number; longitude: number };
  permissions?: string[];
  customJs?: string;
  businessType?: string;
} 