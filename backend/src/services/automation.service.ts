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
  private logger: (message: string) => void;

  private constructor() {
    this.logger = (message: string) => {
      const timestamp = new Date().toISOString();
      // You can replace this with your preferred logging mechanism
      process.stdout.write(`[${timestamp}] [AutomationService] ${message}\n`);
    }
  }

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

    let automationInstance: IBrowserAutomation;
    const library = profile.automationLibrary?.toLowerCase();
    
    switch (library) {
      case 'playwright':
        automationInstance = PlaywrightAutomationService.getInstance();
        break;
      case 'puppeteer':
        automationInstance = PuppeteerAutomationService.getInstance();
        break;
      default:
        // Default to Puppeteer if no library specified
        automationInstance = PuppeteerAutomationService.getInstance();
    }

    // Set the profile on the automation instance
    if ('setProfile' in automationInstance) {
      (automationInstance as any).setProfile(profile);
    }

    return automationInstance;
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
        this.logger(`Executing action: ${action.type}`);
        let success = true;
        let error: string | undefined;

        switch (action.type) {
          case 'variableOperation':
            if (action.operationType && action.variableKey) {
              this.logger(`Performing variable operation: ${action.operationType} on ${action.variableKey}`);
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
            this.logger(`Opening URL: ${action.value}`);
            const waitUntil = action.waitUntil === 'networkidle0' || action.waitUntil === 'networkidle2' 
              ? 'networkidle' 
              : action.waitUntil;
            await this.automation.openUrl(action.value || '', waitUntil);
            break;

          case 'click':
            this.logger(`Clicking element: ${action.selector}`);
            await this.automation.click(action.selector || '', {
              button: action.button,
              clickCount: action.clickCount,
              delay: action.delay
            });
            break;

          case 'type':
            this.logger(`Typing into element: ${action.selector}`);
            await this.automation.type(action.selector || '', action.value || '');
            break;

          case 'select':
            this.logger(`Selecting option in element: ${action.selector}`);
            await this.automation.select(action.selector || '', action.value || '');
            break;

          case 'fileUpload':
            this.logger(`Uploading file to element: ${action.selector}`);
            await this.automation.uploadFile(action.selector || '', action.filePath || '');
            break;

          case 'extract':
            if (action.selector && action.key) {
              this.logger(`Extracting data from element: ${action.selector}`);
              const value = await this.automation.extract(action.selector, action.attribute);
              extractedData[action.key] = value;
              variables[action.key] = value;
            }
            break;

          case 'subtitleToVoice':
            if (action.inputPath && action.outputPath) {
              this.logger(`Converting subtitle to voice: ${action.inputPath} -> ${action.outputPath}`);
            }
            break;

          case 'editVideo':
            if (action.inputPath && action.outputPath && action.operations) {
              this.logger(`Editing video: ${action.inputPath} -> ${action.outputPath}`);
            }
            break;

          case 'filePicker':
            if (action.filePath) {
              this.logger(`Picking file from: ${action.filePath}`);
              const selectedFiles = await this.automation.pickFile(action.filePath, {
                fileName: action.fileName,
                multiple: action.multiple,
                directory: action.directory,
                accept: action.accept
              });

              if (action.variableKey) {
                variables[action.variableKey] = selectedFiles.paths;
              }
              this.logger(`Files selected: ${JSON.stringify(selectedFiles.paths)}`);
            }
            break;

          default:
            success = false;
            error = `Unknown action type: ${action.type}`;
            this.logger(`Error: ${error}`);
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
        this.logger(`Action failed: ${action.type} - ${error instanceof Error ? error.message : String(error)}`);
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