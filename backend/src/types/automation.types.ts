import { BrowserProfile } from './browser.types';

export interface AutomationAction {
  type: 'click' | 'type' | 'screenshot' | 'wait' | 'extract' | 'evaluate' | 'keyboard' | 'select' | 'focus' | 'hover' | 'openUrl' | 'variableOperation' | 'fileUpload' | 'subtitleToVoice' | 'editVideo';
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
  // Variable operation properties
  operationType?: 'set' | 'update' | 'delete' | 'increment' | 'decrement' | 'concat' | 'clear';
  variableKey?: string;
  variableValue?: any;
  variableType?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  sourceVariableKey?: string;
  // File upload properties
  filePath?: string;
  // Subtitle to voice properties
  text?: string;
  // Video editing properties
  videoPath?: string;
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

export interface FingerPrintOptions {
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