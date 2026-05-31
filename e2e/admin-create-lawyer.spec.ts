import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./fixtures/auth";
import { getE2ePassword, hasE2eCredentials, isWebReady } from "./fixtures/env";

/**
 * admin 创建律师用户（首期 MFA 未强制时直接 BFF 登录）。
 */
test.describe("admin create lawyer", () => {
  test.beforeEach(async ({ request }) => {
    test.skip(
      !hasE2eCredentials() || !(await isWebReady(request)),
      "E2E credentials or web server unavailable",
    );
  });

  test("admin creates lawyer user from users panel", async ({
    page,
    request,
  }) => {
    const password = getE2ePassword();
    await loginAsAdmin(page, request, password);

    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: "用户管理" })).toBeVisible();

    const suffix = Date.now();
    const username = `e2e_lawyer_${suffix}`;

    await page.getByRole("button", { name: "创建用户" }).click();
    await page.getByLabel("用户名").fill(username);
    await page.getByLabel("显示名称").fill(`E2E Lawyer ${suffix}`);
    await page.getByRole("button", { name: "创建", exact: true }).click();

    await expect(page.getByText(username)).toBeVisible({ timeout: 15_000 });
  });
});
