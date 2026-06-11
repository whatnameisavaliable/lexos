import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.LEXOS_PREVIEW_BASE_URL;
const previewSmokeReportPath = process.env.LEXOS_PREVIEW_SMOKE_REPORT_PATH || "reports/preview-smoke/results.json";

if (!baseURL) {
  throw new Error("请先设置 LEXOS_PREVIEW_BASE_URL，例如：https://lexos-demo.vercel.app");
}

export default defineConfig({
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  projects: [
    {
      name: "chromium-preview",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { height: 900, width: 1440 },
      },
    },
  ],
  reporter: process.env.CI
    ? [["dot"], ["html", { open: "never" }], ["json", { outputFile: previewSmokeReportPath }]]
    : [["list"], ["html", { open: "never" }], ["json", { outputFile: previewSmokeReportPath }]],
  retries: process.env.CI ? 1 : 0,
  testDir: "./tests/e2e",
  testMatch: /lexos-preview-smoke\.spec\.ts/,
  timeout: 90_000,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
});
