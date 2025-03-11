import { BrowserProfile } from '../types/browser.types';
import { Page } from 'playwright';

export class CDPService {
    private static instance: CDPService | null = null;

    public static getInstance(): CDPService {
        if (!CDPService.instance) {
            CDPService.instance = new CDPService();
        }
        return CDPService.instance;
    }

    private constructor() {}

    async startRecording(page: Page, profile: BrowserProfile): Promise<void> {
        if (!page) {
            throw new Error('Page not initialized');
        }

        try {
            // Get CDP client
            const cdpClient = await page.context().newCDPSession(page);
            
            // Start recording network, DOM changes, and user interactions
            await cdpClient.send('Network.enable');
            await cdpClient.send('Page.enable');
            await cdpClient.send('DOM.enable');
            
            // Listen for events
            cdpClient.on('Network.requestWillBeSent', (params) => {
                console.log('Network request:', params.request.url);
            });

            cdpClient.on('Page.domContentEventFired', () => {
                console.log('DOM content loaded');
            });

            // Add page script to track clicks
            await page.evaluate(() => {
                document.addEventListener('click', (event) => {
                    const target = event.target as Element;
                    console.log('Click:', {
                        tagName: target.tagName,
                        id: target.id,
                        className: target.className,
                        text: target.textContent?.trim()
                    });
                }, true);
            });

            console.log('CDP recording started for profile:', profile.name);
            console.log('Recording network requests and user interactions...');
            
        } catch (error) {
            console.error('Failed to start CDP recording:', error);
            throw error;
        }
    }
} 