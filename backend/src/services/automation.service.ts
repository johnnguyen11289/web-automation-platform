import { IBrowserAutomation } from '../interfaces/browser-automation.interface';
import { AutomationAction, AutomationResult, AutomationStepResult } from '../types/automation.types';
import { BrowserProfile } from '../types/browser.types';
import { PlaywrightAutomationService } from './playwright-automation.service';
import { PuppeteerAutomationService } from './puppeteer-automation.service';

export { AutomationAction } from '../types/automation.types';

export class AutomationService {
  private static instance: AutomationService | null = null;
  private automation: IBrowserAutomation | null = null;
  private currentProfile: BrowserProfile | null = null;

  private constructor() {}

  public static getInstance(): AutomationService {
    if (!AutomationService.instance) {
      AutomationService.instance = new AutomationService();
    }
    return AutomationService.instance;
  }

  private getAutomationLibrary(profile: BrowserProfile): IBrowserAutomation {
    // Close existing automation if it exists
    if (this.automation) {
      this.automation.close().catch(console.error);
    }

    const library = profile.automationLibrary?.toLowerCase();
    switch (library) {
      case 'playwright':
        return PlaywrightAutomationService.getInstance();
      case 'puppeteer':
        return PuppeteerAutomationService.getInstance();
      default:
        // Default to Puppeteer if no library specified
        return PuppeteerAutomationService.getInstance();
    }
  }

  public async applyProfile(profile: BrowserProfile): Promise<void> {
    try {
      // Close existing automation if it exists
      if (this.automation) {
        await this.automation.close();
      }

      this.currentProfile = profile;
      this.automation = this.getAutomationLibrary(profile);
      await this.initialize();
    } catch (error) {
      throw error;
    }
  }

  // For backward compatibility
  public async init(useLocalChrome: boolean = false, profile?: BrowserProfile): Promise<boolean> {
    try {
      // Close existing automation if it exists
      if (this.automation) {
        await this.automation.close();
      }

      if (profile) {
        await this.applyProfile(profile);
      } else {
        // If no profile provided, default to Puppeteer
        this.automation = PuppeteerAutomationService.getInstance();
        await this.initialize();
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  public async initialize(): Promise<void> {
    if (!this.automation) {
      throw new Error('No automation library initialized. Call init() with a profile first.');
    }
    await this.automation.initialize();
  }

  public async close(): Promise<void> {
    if (!this.automation) {
      throw new Error('No automation library initialized. Call init() with a profile first.');
    }
    await this.automation.close();
  }

  public async performWebAutomation(actions: AutomationAction[]): Promise<AutomationResult> {
    if (!this.automation) {
      throw new Error('No automation library initialized. Call init() with a profile first.');
    }

    const results: AutomationStepResult[] = [];
    const extractedData: Record<string, any> = {};
    const variables: Record<string, any> = {};

    for (const action of actions) {
      try {
        let success = true;
        let error: string | undefined;

        switch (action.type) {
          case 'variableOperation':
            if (action.operationType && action.variableKey) {
              switch (action.operationType) {
                case 'set':
                  variables[action.variableKey] = action.variableValue;
                  break;
                case 'update':
                  if (variables[action.variableKey] !== undefined) {
                    variables[action.variableKey] = action.variableValue;
                  }
                  break;
                case 'delete':
                  delete variables[action.variableKey];
                  break;
                case 'increment':
                  if (typeof variables[action.variableKey] === 'number') {
                    variables[action.variableKey] += 1;
                  }
                  break;
                case 'decrement':
                  if (typeof variables[action.variableKey] === 'number') {
                    variables[action.variableKey] -= 1;
                  }
                  break;
                case 'concat':
                  if (typeof variables[action.variableKey] === 'string') {
                    variables[action.variableKey] += action.variableValue || '';
                  }
                  break;
                case 'clear':
                  variables[action.variableKey] = null;
                  break;
              }
            }
            break;

          case 'openUrl':
            await this.automation.openUrl(action.value || '', action.waitUntil);
            break;

          case 'click':
            await this.automation.click(action.selector || '', {
              button: action.button,
              clickCount: action.clickCount,
              delay: action.delay
            });
            break;

          case 'type':
            await this.automation.type(action.selector || '', action.value || '');
            break;

          case 'select':
            await this.automation.select(action.selector || '', action.value || '');
            break;

          case 'fileUpload':
            await this.automation.uploadFile(action.selector || '', action.filePath || '');
            break;

          case 'extract':
            if (action.selector && action.key) {
              const value = await this.automation.extract(action.selector, action.attribute);
              extractedData[action.key] = value;
              // Also store in variables for potential use in variable operations
              variables[action.key] = value;
            }
            break;

          case 'subtitleToVoice':
            if (action.text) {
              // Implement subtitle to voice conversion
              // This is a placeholder - implement actual logic
            }
            break;

          case 'editVideo':
            if (action.videoPath) {
              // Implement video editing
              // This is a placeholder - implement actual logic
            }
            break;

          case 'filePicker':
            if (action.filePath) {
              // Extract variableKey from fileName pattern if present
              const variableMatch = action.fileName?.match(/\{(\w+)\}/);
              if (variableMatch) {
                action.variableKey = variableMatch[1];
              }

              const selectedFiles = await this.automation.pickFile(action.filePath, {
                fileName: action.fileName,
                multiple: action.multiple,
                directory: action.directory,
                accept: action.accept
              });
              
              // Use the extracted variableKey from the pattern
              if (action.variableKey) {
                variables[action.variableKey] = selectedFiles.paths;
              }
            }
            break;

          default:
            success = false;
            error = `Unknown action type: ${action.type}`;
        }

        results.push({
          action,
          success,
          error
        });

        if (!success && action.stopOnError) {
          break;
        }
      } catch (error) {
        results.push({
          action,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });

        if (action.stopOnError) {
          break;
        }
      }
    }

    // Store variables in extractedData for access in workflow context
    extractedData._variables = variables;

    return {
      success: results.every(r => r.success),
      results,
      extractedData
    };
  }

  public async openProfileForSetup(profile: BrowserProfile): Promise<void> {
    if (!this.automation) {
      throw new Error('No automation library initialized. Call init() with a profile first.');
    }
    await this.automation.openProfileForSetup(profile);
  }

  public async injectAntiDetection(): Promise<void> {
    if (!this.automation) {
      throw new Error('No automation library initialized. Call init() with a profile first.');
    }
    await this.automation.injectAntiDetection();
  }
} 