import { Page } from 'playwright';

export class HumanBehaviorService {
  private static instance: HumanBehaviorService | null = null;

  public static getInstance(): HumanBehaviorService {
    if (!HumanBehaviorService.instance) {
      HumanBehaviorService.instance = new HumanBehaviorService();
    }
    return HumanBehaviorService.instance;
  }

  private async getViewportSize(page: any) {
    try {
      return await page.evaluate(() => ({
        width: window.innerWidth,
        height: window.innerHeight
      }));
    } catch (error) {
      console.warn('Failed to get viewport size:', error);
      return { width: 1920, height: 1080 };
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async randomDelay(page: any, min = 100, max = 300): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min) + min);
    await this.delay(delay);
  }

  public async humanMove(page: any, selector: string): Promise<void> {
    const element = await page.$(selector);
    if (!element) return;
    
    const box = await element.boundingBox();
    if (!box) return;

    const viewportSize = await this.getViewportSize(page);
    if (!viewportSize) return;

    // Random start position with natural bias towards common areas
    const startX = Math.random() * viewportSize.width;
    const startY = Math.random() * viewportSize.height;

    // Bezier curve control points for natural movement
    const cp1x = startX + (Math.random() - 0.5) * 100;
    const cp1y = startY + (Math.random() - 0.5) * 100;
    const cp2x = box.x + box.width/2 + (Math.random() - 0.5) * 50;
    const cp2y = box.y + box.height/2 + (Math.random() - 0.5) * 50;
    const endX = box.x + box.width/2;
    const endY = box.y + box.height/2;

    // Move mouse with bezier curve
    const steps = Math.floor(Math.random() * 15) + 10;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const t1 = 1 - t;
      
      // Cubic bezier curve calculation
      const x = t1 * t1 * t1 * startX +
               3 * t1 * t1 * t * cp1x +
               3 * t1 * t * t * cp2x +
               t * t * t * endX;
               
      const y = t1 * t1 * t1 * startY +
               3 * t1 * t1 * t * cp1y +
               3 * t1 * t * t * cp2y +
               t * t * t * endY;

      // Add subtle "shake" to movement
      const shake = Math.sin(t * Math.PI * 2) * (1 - t) * 2;
      const offsetX = shake * (Math.random() - 0.5) * 2;
      const offsetY = shake * (Math.random() - 0.5) * 2;

      await page.mouse.move(x + offsetX, y + offsetY);
      
      // Variable delay between movements
      const moveDelay = Math.random() * 20 + 10;
      await this.delay(moveDelay);
    }

    // Final precise movement to target
    await page.mouse.move(endX, endY);
  }

  public async humanType(page: any, selector: string, text: string): Promise<void> {
    await page.focus(selector);
    
    const typingStyles = [
      { minDelay: 50, maxDelay: 200 }, // slow, careful typing
      { minDelay: 30, maxDelay: 100 }, // moderate typing
      { minDelay: 20, maxDelay: 60 }   // fast typing
    ];
    
    const style = typingStyles[Math.floor(Math.random() * typingStyles.length)];
    
    for (let i = 0; i < text.length; i++) {
      // Simulate common typing errors
      if (Math.random() < 0.03) { // 3% chance of typo
        const typo = text[i].replace(/[a-z]/i, String.fromCharCode(97 + Math.floor(Math.random() * 26)));
        await page.keyboard.type(typo);
        await this.delay(style.maxDelay);
        await page.keyboard.press('Backspace');
        await this.delay(style.maxDelay);
      }
      
      // Simulate natural typing rhythm
      const typeDelay = Math.random() * (style.maxDelay - style.minDelay) + style.minDelay;
      
      // Add slight pause for space or punctuation
      if ([' ', '.', ',', '!', '?'].includes(text[i])) {
        await this.delay(typeDelay * 2);
      }
      
      await page.keyboard.type(text[i]);
      await this.delay(typeDelay);
      
      // Occasional pause while typing
      if (Math.random() < 0.02) { // 2% chance of pause
        await this.delay(Math.random() * 500 + 500);
      }
    }
  }
} 