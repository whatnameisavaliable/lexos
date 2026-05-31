import { defineConfig, devices } from "@playwright/test";

/**
 * LexOS E2E 配置（M9-F）。
 * 运行前须启动 U2 API + U1 Web；可选 `E2E_BASE_URL` 覆盖默认 `http://localhost:3000`。
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? process.env.APP_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
  },
});
