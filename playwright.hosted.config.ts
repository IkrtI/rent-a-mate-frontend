import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.MATEFOR_BASE_URL;
if (!baseURL) throw new Error("Set MATEFOR_BASE_URL to the test deployment URL.");

export default defineConfig({
  testDir: "./hosted-e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
