import { BrowserProfile } from '../types/browser.types';
import * as path from 'path';
import { execSync } from 'child_process';

export class CodegenService {
    private static instance: CodegenService | null = null;

    public static getInstance(): CodegenService {
        if (!CodegenService.instance) {
            CodegenService.instance = new CodegenService();
        }
        return CodegenService.instance;
    }

    private constructor() {}

    async startRecording(profile: BrowserProfile): Promise<void> {
        try {
            console.log('Starting codegen recording session for profile:', profile.name);
            
            // Set up paths
            const installPath = 'C:\\Users\\John\\AppData\\Local\\ms-playwright';
            const userDataDir = path.join(installPath, 'user-data-dirs', `profile-${profile.id}`);
            
            // Ensure the directory exists
            if (!require('fs').existsSync(userDataDir)) {
                require('fs').mkdirSync(userDataDir, { recursive: true });
            }

            // Launch playwright CLI for recording
            const cmd = `npx playwright codegen --save-storage=${userDataDir} --viewport-size=1920,1080 --device="Desktop Chrome" --color-scheme=light`;
            
            console.log('Launching Playwright recorder...');
            execSync(cmd, { stdio: 'inherit' });
            
        } catch (error) {
            console.error('Failed to start codegen recording:', error);
            throw error;
        }
    }
} 