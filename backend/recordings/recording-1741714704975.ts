const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false
  });
  const context = await browser.newContext({
    colorScheme: 'light',
    viewport: {
      height: 1080,
      width: 1920
    }
  });
  const page = await context.newPage();
  await page.goto('https://www.google.com/');
  await page.getByRole('combobox', { name: 'Tìm kiếm' }).click();
  await page.getByRole('combobox', { name: 'Tìm kiếm' }).fill('bach ngu');
  await page.getByRole('link', { name: 'Tra từ: bạch ngư Từ điển Hán' }).click();

  // ---------------------
  await context.storageState({ path: 'D:\\Project\\web-automation-platform\\backend\\recordings\\profile-67d071eae6966eef7931fd1a' });
  await context.close();
  await browser.close();
})();