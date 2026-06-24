const { test, expect } = require('@playwright/test');

test.describe('Basic App Functionality', () => {
  test('App loads successfully', async ({ page }) => {
    await page.goto('http://localhost:8080/');
    await page.waitForTimeout(2000);

    // Check page title
    const title = await page.title();
    expect(title).toBe('Ruff Cuts');
    console.log('✅ Page title correct: Ruff Cuts');

    // Check if React loaded
    const hasReact = await page.evaluate(() => {
      return typeof React !== 'undefined';
    });
    expect(hasReact).toBeTruthy();
    console.log('✅ React loaded successfully');

    // Check if Firebase loaded
    const hasFirebase = await page.evaluate(() => {
      return typeof firebase !== 'undefined';
    });
    expect(hasFirebase).toBeTruthy();
    console.log('✅ Firebase loaded successfully');

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/app-loaded.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: tests/screenshots/app-loaded.png');
  });

  test('CSS overflow-x: hidden is applied to HTML', async ({ page }) => {
    await page.goto('http://localhost:8080/');
    await page.waitForTimeout(1000);

    const htmlOverflow = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).overflowX;
    });

    expect(htmlOverflow).toBe('hidden');
    console.log('✅ HTML has overflow-x: hidden');
  });

  test('Body has overflow-x: hidden', async ({ page }) => {
    await page.goto('http://localhost:8080/');
    await page.waitForTimeout(1000);

    const bodyOverflow = await page.evaluate(() => {
      return window.getComputedStyle(document.body).overflowX;
    });

    expect(bodyOverflow).toBe('hidden');
    console.log('✅ Body has overflow-x: hidden');
  });

  test('Viewport width is correct on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:8080/');
    await page.waitForTimeout(1000);

    const viewportWidth = await page.evaluate(() => {
      return window.innerWidth;
    });

    expect(viewportWidth).toBe(375);
    console.log('✅ Viewport width: 375px (iPhone SE)');

    const documentWidth = await page.evaluate(() => {
      return document.documentElement.scrollWidth;
    });

    console.log(`📏 Document scroll width: ${documentWidth}px`);

    // Document should not be wider than viewport (no horizontal scroll)
    expect(documentWidth).toBeLessThanOrEqual(375);
    console.log('✅ No horizontal overflow on page');
  });

  test('All CDN resources load successfully', async ({ page }) => {
    const resourcesLoaded = {
      react: false,
      reactDom: false,
      firebase: false,
      firestore: false
    };

    page.on('response', response => {
      const url = response.url();
      if (url.includes('react@18.2.0')) resourcesLoaded.react = true;
      if (url.includes('react-dom@18.2.0')) resourcesLoaded.reactDom = true;
      if (url.includes('firebase-app-compat')) resourcesLoaded.firebase = true;
      if (url.includes('firebase-firestore-compat')) resourcesLoaded.firestore = true;
    });

    await page.goto('http://localhost:8080/');
    await page.waitForTimeout(3000);

    console.log('📦 CDN Resources:');
    console.log(`   React: ${resourcesLoaded.react ? '✅' : '❌'}`);
    console.log(`   React DOM: ${resourcesLoaded.reactDom ? '✅' : '❌'}`);
    console.log(`   Firebase: ${resourcesLoaded.firebase ? '✅' : '❌'}`);
    console.log(`   Firestore: ${resourcesLoaded.firestore ? '✅' : '❌'}`);

    expect(resourcesLoaded.react).toBeTruthy();
    expect(resourcesLoaded.reactDom).toBeTruthy();
    expect(resourcesLoaded.firebase).toBeTruthy();
    expect(resourcesLoaded.firestore).toBeTruthy();
  });
});
