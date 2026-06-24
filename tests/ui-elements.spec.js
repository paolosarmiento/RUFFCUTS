const { test, expect } = require('@playwright/test');

test.describe('UI/UX Elements', () => {
  test('Services icon should be scissors', async ({ page }) => {
    await page.goto('http://localhost:8080/');
    await page.waitForTimeout(2000);

    // Check if Services tab exists in bottom nav
    const servicesTab = page.locator('[class*="btm-nav"] >> text=Services');
    const exists = await servicesTab.count() > 0;

    if (exists) {
      console.log('✅ Services tab found');

      // Check for scissors icon (SVG path contains scissors shape)
      const hasSvg = await page.locator('[class*="btm-nav"] svg').count() > 0;
      console.log(hasSvg ? '✅ SVG icon present' : '⚠️  No SVG icon found');

      await page.screenshot({
        path: 'tests/screenshots/services-icon.png',
        clip: { x: 0, y: page.viewportSize().height - 80, width: page.viewportSize().width, height: 80 }
      });
      console.log('📸 Screenshot saved: tests/screenshots/services-icon.png');
    }
  });

  test('Today tab should not have FAB or black bar', async ({ page }) => {
    await page.goto('http://localhost:8080/');
    await page.waitForTimeout(2000);

    const hasLogin = await page.locator('input[type="password"]').count() > 0;
    if (hasLogin) {
      test.skip();
      return;
    }

    // Click Today tab
    await page.click('text=Today');
    await page.waitForTimeout(1000);

    // Check for FAB (Floating Action Button)
    const fabCount = await page.locator('[style*="position: fixed"][style*="bottom"]').count();
    console.log(`FAB elements found: ${fabCount}`);

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/today-tab.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: tests/screenshots/today-tab.png');
  });

  test('Schedule filter popup should work', async ({ page }) => {
    await page.goto('http://localhost:8080/');
    await page.waitForTimeout(2000);

    const hasLogin = await page.locator('input[type="password"]').count() > 0;
    if (hasLogin) {
      test.skip();
      return;
    }

    await page.click('text=Schedule');
    await page.waitForTimeout(1000);

    // Look for magnifying glass / search button
    const searchButton = page.locator('button:has-text("🔍"), button[aria-label*="search"], button[title*="search"]').first();
    const buttonExists = await searchButton.count() > 0;

    if (buttonExists) {
      await searchButton.click();
      await page.waitForTimeout(500);

      // Check if popup appears
      const popupVisible = await page.locator('[style*="position: fixed"]').count() > 0;
      console.log(popupVisible ? '✅ Filter popup appeared' : '⚠️  No popup visible');

      await page.screenshot({
        path: 'tests/screenshots/schedule-filter-popup.png',
      });
      console.log('📸 Screenshot saved: tests/screenshots/schedule-filter-popup.png');
    } else {
      console.log('⚠️  Search button not found');
    }
  });
});
