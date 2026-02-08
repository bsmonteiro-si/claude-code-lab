import { defineConfig, devices } from "@playwright/test";

const TEST_BACKEND_URL = "http://localhost:8001";
const TEST_FRONTEND_URL = "http://localhost:5174";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: TEST_FRONTEND_URL,
    trace: "on-first-retry",
    launchOptions: {
      slowMo: process.env.SLOW ? 800 : 0,
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  webServer: {
    command: `VITE_API_BASE_URL=${TEST_BACKEND_URL} npx vite --port 5174`,
    url: TEST_FRONTEND_URL,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
