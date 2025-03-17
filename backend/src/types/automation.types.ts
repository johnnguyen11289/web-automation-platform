import { BrowserProfile } from './browser.types';

export interface AutomationAction {
  type: 'click' | 'type' | 'select' | 'extract' | 'fileUpload' | 'wait' | 'focus' | 'hover' | 'screenshot' | 'dragDrop' | 'openUrl' | 'subtitleToVoice' | 'editVideo' | 'variableOperation' | 'filePicker' | 'evaluate' | 'keyboard';
  selector?: string;
  waitForSelector?: string;
  waitForSelectorRemoval?: string;
  timeout?: number;
  value?: string;
  button?: 'left' | 'right' | 'middle';
  clickCount?: number;
  delay?: number;
  clearFirst?: boolean;
  waitForNavigation?: boolean;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'networkidle0' | 'networkidle2';
  attribute?: string;
  key?: string;
  filePath?: string;
  fileName?: string;
  multiple?: boolean;
  directory?: boolean;
  accept?: string;
  variableKey?: string;
  stopOnError?: boolean;
  condition?: 'delay' | 'selectorPresent' | 'selectorRemoved' | 'networkIdle';
  sourceSelector?: string;
  targetSelector?: string;
  path?: string;
  inputPath?: string;
  outputPath?: string;
  language?: string;
  options?: Record<string, any>;
  operations?: Array<{
    type: string;
    value?: any;
    [key: string]: any;
  }>;
  operationType?: 'set' | 'update' | 'delete' | 'increment' | 'decrement' | 'concat' | 'clear';
  variableValue?: any;
  variableType?: 'string' | 'number' | 'boolean' | 'json' | 'array';
  sourceVariableKey?: string;
  script?: string;
  url?: string;
}

export interface AutomationStepResult {
  action: AutomationAction;
  success: boolean;
  error?: string;
  selectedFiles?: string[];
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