import { BrowserProfile } from '../types/browser.types';
import * as path from 'path';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';

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

    async startRecording(profile: BrowserProfile): Promise<string> {
        try {
            console.log('Starting codegen recording session for profile:', profile.name);
            
            // Create a temporary file for recording output
            const tempDir = os.tmpdir();
            const outputFile = path.join(tempDir, `recording-${Date.now()}.ts`);
            const userDataDir = path.join(tempDir, `profile-${profile._id}`);
            
            // Ensure the directory exists
            if (!fs.existsSync(userDataDir)) {
                fs.mkdirSync(userDataDir, { recursive: true });
            }

            // Determine the correct command and args based on platform
            const isWindows = process.platform === 'win32';
            const command = isWindows ? 'npx.cmd' : 'npx';
            
            // Launch playwright CLI for recording with selector preference
            const args = [
                'playwright',
                'codegen',
                `--save-storage="${userDataDir}"`,
                '--viewport-size=1920,1080',
                '--browser=chromium',
                '--color-scheme=light',
                `--output="${outputFile}"`,
                '--target=javascript'
            ];

            console.log('Executing command:', command, args.join(' '));

            return new Promise((resolve, reject) => {
                this.currentProcess = spawn(command, args, {
                    stdio: ['inherit', 'pipe', 'pipe'],
                    shell: true,
                    env: {
                        ...process.env,
                        PATH: `${process.env.PATH};${process.cwd()}\\node_modules\\.bin`,
                        PWTEST_PREFER_SELECTORS: '1',
                        PWTEST_PREFER_CSS_SELECTOR: '1'
                    }
                });

                let output = '';
                this.currentProcess.stdout?.on('data', (data: Buffer) => {
                    const message = data.toString();
                    console.log('Codegen output:', message);
                    output += message;
                });

                this.currentProcess.stderr?.on('data', (data: Buffer) => {
                    const message = data.toString();
                    console.error('Codegen error:', message);
                });

                this.currentProcess.on('error', (error: Error) => {
                    console.error('Failed to start codegen process:', error);
                    this.cleanup(outputFile, userDataDir);
                    reject(error);
                });

                this.currentProcess.on('close', (code: number) => {
                    console.log('Codegen process closed with code:', code);
                    if (code === 0) {
                        try {
                            if (fs.existsSync(outputFile)) {
                                let generatedCode = fs.readFileSync(outputFile, 'utf8');
                                // Convert role-based selectors to CSS selectors
                                generatedCode = this.convertToSelectors(generatedCode);
                                // Clean up temporary files
                                this.cleanup(outputFile, userDataDir);
                                resolve(generatedCode);
                            } else {
                                this.cleanup(outputFile, userDataDir);
                                reject(new Error('Output file not found'));
                            }
                        } catch (error) {
                            console.error('Failed to read generated code:', error);
                            this.cleanup(outputFile, userDataDir);
                            reject(new Error('Failed to read generated code'));
                        }
                    } else {
                        this.cleanup(outputFile, userDataDir);
                        reject(new Error(`Codegen process exited with code ${code}`));
                    }
                });
            });
            
        } catch (error) {
            console.error('Failed to start codegen recording:', error);
            throw error;
        }
    }

    private convertToSelectors(code: string): string {
        // Convert getByRole to locator with appropriate selectors
        return code.replace(
            /getByRole\(['"]([^'"]+)['"](?:,\s*{\s*name:\s*['"]([^'"]+)['"]\s*})?\)/g,
            (match, role, name) => {
                // For specific roles, include the element type
                if (role === 'combobox' || role === 'textbox') {
                    return name ? 
                        `locator('textarea[name="${name}"][role="${role}"]')` :
                        `locator('textarea[role="${role}"]')`;
                }
                if (role === 'button') {
                    return name ? 
                        `locator('button[name="${name}"]')` :
                        `locator('button')`;
                }
                if (name) {
                    return `locator('[role="${role}"][name="${name}"]')`;
                }
                return `locator('[role="${role}"]')`;
            }
        ).replace(
            // Convert getByText to locator with text selector
            /getByText\(['"]([^'"]+)['"]\)/g,
            (match, text) => `locator(':text("${text}")')`
        ).replace(
            // Convert getByLabel to locator with aria-label selector
            /getByLabel\(['"]([^'"]+)['"]\)/g,
            (match, label) => `locator('[aria-label="${label}"]')`
        ).replace(
            // Convert getByPlaceholder to locator with placeholder selector
            /getByPlaceholder\(['"]([^'"]+)['"]\)/g,
            (match, placeholder) => `locator('input[placeholder="${placeholder}"], textarea[placeholder="${placeholder}"]')`
        ).replace(
            // Convert getByTestId to data-testid selector
            /getByTestId\(['"]([^'"]+)['"]\)/g,
            (match, testId) => `locator('[data-testid="${testId}"]')`
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