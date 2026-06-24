const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 0,
  workers: 1,

  use: {
    baseURL: 'http://localhost:8080',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'mobile-chrome',
      use: {
        browserName: 'chromium',
        viewport: { width: 375, height: 667 }, // iPhone SE
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      },
    },
  ],

  webServer: {
    command: 'python3 -m http.server 8080',
    port: 8080,
    timeout: 120000,
    reuseExistingServer: true,
  },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'tests/playwright-report' }],
  ],
});
