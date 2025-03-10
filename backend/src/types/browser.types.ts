export type BrowserType = 'chromium' | 'firefox' | 'webkit';

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
  id: string;
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