const { test, expect } = require('@playwright/test');

test.describe('Mobile Overflow Fixes - Schedule Tab', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE
  });

  test('Day Summary cards should not scroll horizontally', async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:8080/');

    // Wait for app to load
    await page.waitForTimeout(2000);

    // Check if login screen appears
    const hasLogin = await page.locator('input[type="password"]').count() > 0;

    if (hasLogin) {
      console.log('⚠️  Login required - cannot test without credentials');
      test.skip();
      return;
    }

    // Navigate to Schedule tab
    await page.click('text=Schedule');
    await page.waitForTimeout(1000);

    // Check HTML overflow-x
    const htmlOverflow = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).overflowX;
    });
    expect(htmlOverflow).toBe('hidden');
    console.log('✅ HTML overflow-x: hidden');

    // Check .cal-wrap maxWidth on mobile
    const calWrapMaxWidth = await page.evaluate(() => {
      const calWrap = document.querySelector('.cal-wrap');
      if (!calWrap) return null;
      return window.getComputedStyle(calWrap).maxWidth;
    });

    if (calWrapMaxWidth) {
      console.log(`✅ .cal-wrap maxWidth: ${calWrapMaxWidth}`);
      // Should be 100vw (375px on iPhone SE)
      expect(calWrapMaxWidth).toMatch(/375px|100vw/);
    }

    // Check if Day Summary section exists
    const hasDaySummary = await page.locator('text=Day Summary').count() > 0;

    if (hasDaySummary) {
      // Scroll to Day Summary
      await page.locator('text=Day Summary').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Check Cashbox Balance card width
      const cashboxCard = page.locator('text=Cashbox Balance').locator('..');
      const boundingBox = await cashboxCard.boundingBox();

      if (boundingBox) {
        console.log(`📏 Cashbox card width: ${boundingBox.width}px`);
        expect(boundingBox.width).toBeLessThanOrEqual(375);
      }

      // Take screenshot for verification
      await page.screenshot({
        path: 'tests/screenshots/day-summary-mobile.png',
        fullPage: true
      });
      console.log('📸 Screenshot saved: tests/screenshots/day-summary-mobile.png');
    }
  });

  test('Calendar grid should scroll horizontally when wide', async ({ page }) => {
    await page.goto('http://localhost:8080/');
    await page.waitForTimeout(2000);

    const hasLogin = await page.locator('input[type="password"]').count() > 0;
    if (hasLogin) {
      test.skip();
      return;
    }

    await page.click('text=Schedule');
    await page.waitForTimeout(1000);

    // Check if calendar grid has overflow
    const calendarOverflow = await page.evaluate(() => {
      const scrollWrapper = document.querySelector('.cal-wrap > div');
      if (!scrollWrapper) return null;
      return {
        overflowX: window.getComputedStyle(scrollWrapper).overflowX,
        scrollWidth: scrollWrapper.scrollWidth,
        clientWidth: scrollWrapper.clientWidth
      };
    });

    if (calendarOverflow) {
      console.log(`📊 Calendar: scrollWidth=${calendarOverflow.scrollWidth}px, clientWidth=${calendarOverflow.clientWidth}px`);
      console.log(`✅ Calendar overflow-x: ${calendarOverflow.overflowX}`);

      if (calendarOverflow.scrollWidth > calendarOverflow.clientWidth) {
        expect(calendarOverflow.overflowX).toBe('auto');
        console.log('✅ Calendar is scrollable horizontally');
      }
    }
  });
});
