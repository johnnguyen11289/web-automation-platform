import { BrowserProfile } from '../types/browser.types';
import * as path from 'path';
import { spawn } from 'child_process';
import * as fs from 'fs';

export class CodegenService {
    private static instance: CodegenService | null = null;
    private outputPath: string;
    private currentProcess: any = null;

    public static getInstance(): CodegenService {
        if (!CodegenService.instance) {
            CodegenService.instance = new CodegenService();
        }
        return CodegenService.instance;
    }

    private constructor() {
        this.outputPath = path.join(process.cwd(), 'recordings');
        if (!fs.existsSync(this.outputPath)) {
            fs.mkdirSync(this.outputPath, { recursive: true });
        }
    }

    async startRecording(profile: BrowserProfile): Promise<string> {
        try {
            console.log('Starting codegen recording session for profile:', profile.name);
            
            // Set up paths
            const userDataDir = path.join(this.outputPath, `profile-${profile._id}`);
            const outputFile = path.join(this.outputPath, `recording-${Date.now()}.ts`);
            
            // Ensure the directory exists
            if (!fs.existsSync(userDataDir)) {
                fs.mkdirSync(userDataDir, { recursive: true });
            }

            // Determine the correct command and args based on platform
            const isWindows = process.platform === 'win32';
            const command = isWindows ? 'npx.cmd' : 'npx';
            
            // Launch playwright CLI for recording
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
                        PATH: `${process.env.PATH};${process.cwd()}\\node_modules\\.bin`
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
                    reject(error);
                });

                this.currentProcess.on('close', (code: number) => {
                    console.log('Codegen process closed with code:', code);
                    if (code === 0) {
                        try {
                            if (fs.existsSync(outputFile)) {
                                const generatedCode = fs.readFileSync(outputFile, 'utf8');
                                resolve(generatedCode);
                            } else {
                                reject(new Error('Output file not found'));
                            }
                        } catch (error) {
                            console.error('Failed to read generated code:', error);
                            reject(new Error('Failed to read generated code'));
                        }
                    } else {
                        reject(new Error(`Codegen process exited with code ${code}`));
                    }
                });
            });
            
        } catch (error) {
            console.error('Failed to start codegen recording:', error);
            throw error;
        }
    }

    async stopRecording(): Promise<void> {
        if (this.currentProcess) {
            this.currentProcess.kill();
            this.currentProcess = null;
        }
    }
} 