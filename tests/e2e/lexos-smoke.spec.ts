import { expect, test } from "@playwright/test";

async function loginAndChangePassword(page: import("@playwright/test").Page, username: string) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "登录工作台" })).toBeVisible();
  await expect(page.getByText("本地工作区模式")).toBeVisible();

  await page.getByLabel("用户名").fill(username);
  await page.getByLabel("密码").fill("111111");
  await page.getByRole("button", { name: "进入 Lexos" }).click();

  await expect(page.getByRole("heading", { name: "首次登录需要修改密码" })).toBeVisible();
  await page.getByLabel("新密码").fill("11111111");
  await page.getByRole("button", { name: "修改并进入" }).click();
}

test.describe("Lexos 本地工作区冒烟流程", () => {
  test("管理员只进入系统配置入口，主任进入全所经营视图", async ({ page }) => {
    await loginAndChangePassword(page, "admin");

    await expect(page.getByRole("heading", { name: "用户管理" })).toBeVisible();
    await expect(page.getByRole("button", { name: "人员" })).toBeVisible();
    await expect(page.getByRole("button", { name: "职级" })).toBeVisible();
    await expect(page.getByRole("button", { name: "审计" })).toBeVisible();
    await expect(page.getByRole("button", { name: "参数" })).toBeVisible();
    await expect(page.getByRole("button", { name: "权限" })).toBeVisible();
    await expect(page.getByRole("button", { name: "任务", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "结算" })).toHaveCount(0);

    await page.getByLabel("退出登录").click();
    await loginAndChangePassword(page, "director01");

    await expect(page.getByRole("heading", { name: "律所协作总览" })).toBeVisible();
    await expect(page.getByText("律师绩效")).toBeVisible();
    await expect(page.getByRole("button", { name: "任务", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "风控" })).toBeVisible();
    await expect(page.getByRole("button", { name: "结算" })).toBeVisible();
    await expect(page.getByRole("button", { name: "资金" })).toBeVisible();

    await page.getByRole("button", { name: "任务", exact: true }).click();
    await expect(page.getByRole("heading", { name: "任务工作台" })).toBeVisible();
    await expect(page.getByLabel("任务排序")).toBeVisible();

    await page.getByRole("button", { name: "风控" }).click();
    await expect(page.getByRole("heading", { name: "投诉与风控" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "风控工单", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "结算" }).click();
    await expect(page.getByRole("heading", { name: "结算管理" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "结算记录" })).toBeVisible();
  });
});
