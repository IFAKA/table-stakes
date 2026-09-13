import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL: "http://127.0.0.1:3000", ...devices["Desktop Chrome"], launchOptions: { executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" } },
  webServer: { command: "npm run dev", url: "http://127.0.0.1:3000", reuseExistingServer: true },
});
