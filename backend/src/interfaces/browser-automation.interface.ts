import { AutomationAction, AutomationResult } from '../types/automation.types';
import { BrowserProfile } from '../types/browser.types';
import { Permission } from 'puppeteer';

export interface IBrowserAutomation {
  // Browser lifecycle
  initialize(): Promise<void>;
  close(): Promise<void>;
  getPage(): Promise<any>; // Using 'any' here as different libraries have different Page types
  
  // Navigation
  goto(url: string, options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle', timeout?: number }): Promise<void>;
  
  // Element interactions
  click(selector: string, options?: { button?: 'left' | 'right' | 'middle', clickCount?: number, delay?: number }): Promise<void>;
  type(selector: string, text: string, options?: { delay?: number }): Promise<void>;
  select(selector: string, value: string): Promise<void>;
  focus(selector: string): Promise<void>;
  hover(selector: string): Promise<void>;
  
  // Waiting
  waitForSelector(selector: string, options?: { timeout?: number }): Promise<void>;
  waitForLoadState(state: 'load' | 'domcontentloaded' | 'networkidle'): Promise<void>;
  waitForTimeout(ms: number): Promise<void>;
  
  // Evaluation
  evaluate(script: string): Promise<any>;
  
  // Screenshots
  screenshot(options?: { path?: string }): Promise<Buffer>;
  
  // Profile management
  openProfileForSetup(profile: BrowserProfile): Promise<void>;
  
  // Anti-detection
  injectAntiDetection(): Promise<void>;
  
  // Automation
  performWebAutomation(actions: AutomationAction[]): Promise<AutomationResult>;

  // New methods from the code block
  openUrl(url: string, waitUntil?: 'load' | 'domcontentloaded' | 'networkidle'): Promise<void>;
  uploadFile(selector: string, filePath: string): Promise<void>;
  extract(selector: string, attribute?: string): Promise<string>;
  pickFile(filePath: string, options?: { fileName?: string, multiple?: boolean, directory?: boolean, accept?: string }): Promise<{ paths: string | string[], variableKey?: string }>;
  setProfile(profile: BrowserProfile): void;
} 