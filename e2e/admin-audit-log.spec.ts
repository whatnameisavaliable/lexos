import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./fixtures/auth";
import { getE2ePassword, hasE2eCredentials, isWebReady } from "./fixtures/env";

/**
 * 管理员审计列表可见关键事件。
 */
test.describe("admin audit log", () => {
  test.beforeEach(async ({ request }) => {
    test.skip(
      !hasE2eCredentials() || !(await isWebReady(request)),
      "E2E credentials or web server unavailable",
    );
  });

  test("audit list shows login and download actions", async ({
    page,
    request,
  }) => {
    await loginAsAdmin(page, request, getE2ePassword());
    await page.goto("/admin/audit");

    await expect(page.getByRole("heading", { name: "审计日志" })).toBeVisible();

    await page.getByLabel("操作类型").click();
    await page.getByRole("option", { name: /登录成功/ }).click();
    await expect(page.getByText("登录成功").first()).toBeVisible({
      timeout: 15_000,
    });

    await page.getByLabel("操作类型").click();
    await page.getByRole("option", { name: /下载/ }).click();
    await expect(
      page.getByText(/下载|file\.download/).first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});
