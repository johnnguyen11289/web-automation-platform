import { BrowserProfile } from '../types/browser.types';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { config } from '../config/config';
import { AutomationService } from './automation.service';

export class CodegenService {
    private static instance: CodegenService | null = null;
    private currentProcess: any = null;

    public static getInstance(): CodegenService {
        if (!CodegenService.instance) {
            CodegenService.instance = new CodegenService();
        }
        return CodegenService.instance;
    }

    private constructor() {}

    async startRecording(options: {
        profilePath: string;
        viewport: { width: number; height: number };
        outputPath: string;
    }): Promise<{ success: boolean }> {
        try {
            // Ensure browser is installed
            const automationService = AutomationService.getInstance();
            await automationService.init();

            // Set environment variable for Playwright
            process.env.PLAYWRIGHT_BROWSERS_PATH = AutomationService.getBrowserPath();

            const command = `npx playwright codegen` +
                ` --save-storage="${options.profilePath}"` +
                ` --viewport-size=${options.viewport.width},${options.viewport.height}` +
                ` --browser=chromium` +
                ` --color-scheme=light` +
                ` --output="${options.outputPath}"` +
                ` --target=javascript`;

            console.log('Starting codegen with command:', command);
            console.log('Using browser at:', AutomationService.getBrowserExecutablePath());

            try {
                execSync(command, { 
                    stdio: 'inherit',
                    env: {
                        ...process.env,
                        PLAYWRIGHT_BROWSERS_PATH: AutomationService.getBrowserPath()
                    }
                });
            } catch (error) {
                // If the process was terminated early (e.g., user closed the browser),
                // we consider this a normal case
                console.log('Codegen process ended:', error instanceof Error ? error.message : 'Unknown error');
            }

            // Check if any code was generated
            if (fs.existsSync(options.outputPath)) {
                const content = fs.readFileSync(options.outputPath, 'utf8');
                if (content.trim()) {
                    return { success: true };
                }
            }

            // If we reach here, no code was generated (normal case when user just opens and closes)
            return { success: true };
        } catch (error) {
            console.error('Failed to start recording:', error);
            throw new Error('Failed to start recording: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            // Cleanup any temporary files
            try {
                if (fs.existsSync(options.outputPath)) {
                    fs.unlinkSync(options.outputPath);
                }
            } catch (cleanupError) {
                console.error('Error cleaning up temporary files:', cleanupError);
            }
        }
    }

    private convertToSelectors(code: string): string {
        // Extract raw selectors from the code, removing quotes
        return code.replace(
            /locator\((["'`])(.*?)\1\)/g,
            (match, quote, selector) => `locator(${selector})`
        ).replace(
            /getByRole\((["'`])([^'"]+)\1(?:,\s*{\s*name:\s*(["'`])([^'"]+)\3\s*})?\)/g,
            (match, quote1, role, quote2, name) => {
                if (name) {
                    return `locator([role=${role}][name=${name}], [role=${role}][aria-label=${name}])`;
                }
                return `locator([role=${role}])`;
            }
        ).replace(
            /getByText\((["'`])([^'"]+)\1\)/g,
            (match, quote, text) => `locator(:text(${text}))`
        ).replace(
            /getByLabel\((["'`])([^'"]+)\1\)/g,
            (match, quote, label) => `locator([aria-label=${label}])`
        ).replace(
            /getByPlaceholder\((["'`])([^'"]+)\1\)/g,
            (match, quote, placeholder) => `locator([placeholder=${placeholder}])`
        ).replace(
            /getByTestId\((["'`])([^'"]+)\1\)/g,
            (match, quote, testId) => `locator([data-testid=${testId}])`
        );
    }

    private cleanup(outputFile: string, userDataDir: string): void {
        try {
            // Delete the temporary recording file if it exists
            if (fs.existsSync(outputFile)) {
                fs.unlinkSync(outputFile);
            }
            // Delete the temporary user data directory if it exists
            if (fs.existsSync(userDataDir)) {
                fs.rmSync(userDataDir, { recursive: true, force: true });
            }
        } catch (error) {
            console.error('Error cleaning up temporary files:', error);
        }
    }

    async stopRecording(): Promise<void> {
        if (this.currentProcess) {
            this.currentProcess.kill();
            this.currentProcess = null;
        }
    }
} 