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
  useLocalChrome?: boolean;
  userDataDir?: string;
  locale?: string;
  timezone?: string;
  geolocation?: { latitude: number; longitude: number };
  permissions?: string[];
  customJs?: string;
  businessType?: string;
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

export const LOCALES = [
  { value: 'vi-VN', label: 'Vietnamese (Vietnam)' },
  { value: 'en-US', label: 'English (United States)' },
  { value: 'en-GB', label: 'English (United Kingdom)' },
  { value: 'es-ES', label: 'Spanish (Spain)' },
  { value: 'fr-FR', label: 'French (France)' },
  { value: 'de-DE', label: 'German (Germany)' },
  { value: 'it-IT', label: 'Italian (Italy)' },
  { value: 'pt-BR', label: 'Portuguese (Brazil)' },
  { value: 'ru-RU', label: 'Russian (Russia)' },
  { value: 'ja-JP', label: 'Japanese (Japan)' },
  { value: 'ko-KR', label: 'Korean (Korea)' },
  { value: 'zh-CN', label: 'Chinese (Simplified)' },
  { value: 'zh-TW', label: 'Chinese (Traditional)' },
];

export const TIMEZONES = [
  { value: 'Asia/Ho_Chi_Minh', label: 'Vietnam (UTC+7)' },
  { value: 'America/New_York', label: 'New York (UTC-4/5)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-7/8)' },
  { value: 'America/Chicago', label: 'Chicago (UTC-5/6)' },
  { value: 'America/Toronto', label: 'Toronto (UTC-4/5)' },
  { value: 'Europe/London', label: 'London (UTC+0/1)' },
  { value: 'Europe/Paris', label: 'Paris (UTC+1/2)' },
  { value: 'Europe/Berlin', label: 'Berlin (UTC+1/2)' },
  { value: 'Europe/Moscow', label: 'Moscow (UTC+3)' },
  { value: 'Asia/Dubai', label: 'Dubai (UTC+4)' },
  { value: 'Asia/Singapore', label: 'Singapore (UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (UTC+8)' },
  { value: 'Australia/Sydney', label: 'Sydney (UTC+10/11)' },
  { value: 'Pacific/Auckland', label: 'Auckland (UTC+12/13)' },
]; 