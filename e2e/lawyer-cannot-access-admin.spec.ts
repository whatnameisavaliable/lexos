import { test, expect } from "@playwright/test";
import { loginAsLawyer } from "./fixtures/auth";
import { getE2ePassword, hasE2eCredentials, isWebReady } from "./fixtures/env";

/**
 * 律师访问管理端被拒绝。
 */
test.describe("lawyer cannot access admin", () => {
  test.beforeEach(async ({ request }) => {
    test.skip(
      !hasE2eCredentials() || !(await isWebReady(request)),
      "E2E credentials or web server unavailable",
    );
  });

  test("lawyer is denied /admin/users", async ({ page, request }) => {
    const password = getE2ePassword();
    const username = process.env.E2E_LAWYER_USERNAME ?? "lawyer";
    await loginAsLawyer(page, request, username, password);

    await page.goto("/admin/users");
    await expect(page).toHaveURL(/unauthorized|login|lawyer/);
    await expect(page.getByRole("heading", { name: "用户管理" })).not.toBeVisible();
  });
});
