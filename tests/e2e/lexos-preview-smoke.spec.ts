import { expect, test } from "@playwright/test";

const expectedMode = process.env.LEXOS_PREVIEW_EXPECT_MODE;

test.describe("Lexos 远端 Preview 冒烟流程", () => {
  test("健康检查接口返回安全的部署状态", async ({ request }) => {
    const response = await request.get("/api/health");

    expect(response.ok()).toBeTruthy();

    const body = (await response.json()) as {
      data?: {
        app?: string;
        commit?: string;
        missingSupabaseEnvKeys?: string[];
        mode?: string;
        ok?: boolean;
        timestamp?: string;
        vercelEnv?: string;
      };
    };

    expect(body.data?.app).toBe("lexos");
    expect(body.data?.ok).toBe(true);
    expect(["demo", "supabase"]).toContain(body.data?.mode);
    expect(Array.isArray(body.data?.missingSupabaseEnvKeys)).toBe(true);
    expect(body.data?.commit).toBeTruthy();
    expect(body.data?.timestamp).toBeTruthy();
    expect(body.data?.vercelEnv).toBeTruthy();

    if (expectedMode) {
      expect(body.data?.mode).toBe(expectedMode);
    }
  });

  test("内存 demo 可完成登录、客户大屏校验和结算页访问", async ({ page }) => {
    test.skip(expectedMode === "supabase", "真实 Supabase Preview 先只检查健康接口，登录闭环使用 smoke:real 验证。");

    await page.goto("/");

    await expect(page.getByRole("heading", { name: "登录工作台" })).toBeVisible();
    await expect(page.getByText("本地 Demo 模式")).toBeVisible();

    await page.getByLabel("用户名").fill("admin");
    await page.getByLabel("密码").fill("111111");
    await page.getByRole("button", { name: "进入 Lexos" }).click();

    await expect(page.getByRole("heading", { name: "首次登录需要修改密码" })).toBeVisible();
    await page.getByLabel("新密码").fill("11111111");
    await page.getByRole("button", { name: "修改并进入" }).click();

    await expect(page.getByRole("heading", { name: "律所协作总览" })).toBeVisible();
    await expect(page.getByText("客户大屏 demo")).toBeVisible();

    await page.getByLabel("访问 token").fill("LEXOS-DEMO-004");
    await page.getByLabel("客户手机号").fill("13800000000");
    await page.getByLabel("验证码").fill("111111");
    await page.getByRole("button", { name: "校验访问" }).click();

    await expect(page.getByText("民商事一审代理材料准备")).toBeVisible();
    await expect(page.getByText("案源律师已验收")).toBeVisible();
    await expect(page.getByRole("button", { name: "确认接收并评分" })).toBeVisible();

    await page.getByRole("button", { name: "结算" }).click();
    await expect(page.getByRole("heading", { name: "结算管理" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "结算记录" })).toBeVisible();
  });
});
