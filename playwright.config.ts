import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false, // Run tests sequentially for CRUD operations
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1, // Single worker to maintain test order
    reporter: 'html',
    use: {
        baseURL: process.env.E2E_BASE_URL || 'https://thawaq-inventory.vercel.app',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    timeout: 60000, // 60 second timeout per test
});
