import { BrowserProfile } from '../types/browser.types';
import * as path from 'path';
import { chromium, BrowserContext } from 'playwright';
import * as fs from 'fs';

export class ExtensionService {
    private static instance: ExtensionService | null = null;

    public static getInstance(): ExtensionService {
        if (!ExtensionService.instance) {
            ExtensionService.instance = new ExtensionService();
        }
        return ExtensionService.instance;
    }

    private constructor() {}

    async startRecording(profile: BrowserProfile): Promise<BrowserContext> {
        try {
            console.log('Starting extension recording for profile:', profile.name);
            
            // Set up paths
            const installPath = 'C:\\Users\\John\\AppData\\Local\\ms-playwright';
            const userDataDir = path.join(installPath, 'user-data-dirs', `profile-${profile._id}`);
            const extensionsDir = path.join(process.cwd(), 'extensions');
            
            // Ensure directories exist
            if (!fs.existsSync(userDataDir)) {
                fs.mkdirSync(userDataDir, { recursive: true });
            }
            if (!fs.existsSync(extensionsDir)) {
                fs.mkdirSync(extensionsDir, { recursive: true });
            }

            // Set up browser context options
            const contextOptions = {
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                headless: false,
                args: [
                    `--disable-extensions-except=${extensionsDir}`,
                    `--load-extension=${extensionsDir}`
                ],
                recordVideo: {
                    dir: path.join(process.cwd(), 'recordings')
                }
            };

            // Launch browser with extensions
            const browser = await chromium.launchPersistentContext(userDataDir, contextOptions);
            const page = await browser.newPage();
            await page.goto('about:blank');

            console.log('Extension recording started. Use the extension toolbar to control recording.');
            
            return browser;
            
        } catch (error) {
            console.error('Failed to start extension recording:', error);
            throw error;
        }
    }
} 