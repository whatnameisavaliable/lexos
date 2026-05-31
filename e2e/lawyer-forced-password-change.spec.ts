import { test, expect } from "@playwright/test";
import { loginViaBff, applyBrowserSession } from "./fixtures/auth";
import { getE2ePassword, hasE2eCredentials, isWebReady } from "./fixtures/env";

/**
 * 律师首登强制改密后进入业务区。
 */
test.describe("lawyer forced password change", () => {
  test.beforeEach(async ({ request }) => {
    test.skip(
      !hasE2eCredentials() || !(await isWebReady(request)),
      "E2E credentials or web server unavailable",
    );
  });

  test("lawyer changes password and reaches business area", async ({
    page,
    request,
  }) => {
    const initialPassword = getE2ePassword();
    const username = process.env.E2E_LAWYER_USERNAME ?? "lawyer";

    const session = await loginViaBff(request, {
      username,
      password: initialPassword,
    });

    test.skip(
      !session.requiresPasswordChange,
      "Lawyer account does not require password change in this environment",
    );

    await page.goto("/login");
    await applyBrowserSession(page, session);
    await page.goto("/change-password");

    const newPassword = `${initialPassword}X1`;
    await page.getByLabel("当前密码").fill(initialPassword);
    await page.getByLabel("新密码", { exact: true }).fill(newPassword);
    await page.getByLabel("确认新密码").fill(newPassword);
    await page.getByRole("button", { name: "保存" }).click();

    await expect(page).toHaveURL(/\/(lawyer|drive)/, { timeout: 15_000 });
  });
});
