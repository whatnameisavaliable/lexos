import { expect, test } from "@playwright/test";

test.describe("Lexos 本地 Demo 冒烟流程", () => {
  test("管理员首次登录后可以进入任务和结算核心页面", async ({ page }) => {
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
    await expect(page.getByText("个人工作台", { exact: true })).toBeVisible();
    await expect(page.getByText("系统管理员的个人工作台")).toBeVisible();
    await expect(page.getByText("任务总数")).toBeVisible();
    await expect(page.getByText("逾期视为交付")).toBeVisible();
    await expect(page.getByText("逾期待处理")).toBeVisible();
    await expect(page.getByText("办案律师绩效")).toBeVisible();
    await expect(page.getByText("绩效领先")).toBeVisible();

    await page.getByRole("button", { name: "用户" }).click();
    await expect(page.getByRole("heading", { name: "用户管理" })).toBeVisible();
    await expect(page.getByLabel("按账号状态筛选用户")).toBeVisible();
    await expect(page.getByRole("button", { name: "编辑" }).first()).toBeVisible();

    await page.getByRole("button", { name: "参数" }).click();
    await expect(page.getByRole("heading", { name: "系统参数" })).toBeVisible();
    await expect(page.getByText("客户大屏演示验证码")).toBeVisible();
    await expect(page.getByText("二级一般扣减比例")).toBeVisible();

    await page.getByRole("button", { name: "权限" }).click();
    await expect(page.getByRole("heading", { name: "角色权限" })).toBeVisible();
    await expect(page.getByText("菜单权限矩阵")).toBeVisible();

    await page.getByRole("button", { name: "风控" }).click();
    await expect(page.getByRole("heading", { name: "投诉与风控" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "风控工单", exact: true })).toBeVisible();
    await expect(page.getByText("建议扣减").first()).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "委员会裁决" })).toBeVisible();
    await page.getByLabel(/委员会裁决意见/).first().fill("采纳办案律师答辩，记录警示并办结。");
    await page.getByRole("button", { name: "提交裁决" }).first().click();
    await expect(page.getByText("警示记录").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "开始处理" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "办结" }).first()).toBeVisible();

    await page.getByRole("button", { name: "我的任务" }).click();
    await expect(page.getByRole("heading", { name: "我的任务" })).toBeVisible();
    await expect(page.getByLabel("任务排序")).toBeVisible();

    await page.getByRole("button", { name: "详情" }).first().click();
    await expect(page.getByText("任务金额", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("客户 token").first()).toBeVisible();
    await expect(page.getByText("任务时间线").first()).toBeVisible();
    await expect(page.getByText("交付记录").first()).toBeVisible();
    await expect(page.getByText("结算关联").first()).toBeVisible();

    await page.getByRole("button", { name: "结算" }).click();
    await expect(page.getByRole("heading", { name: "结算管理" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "结算记录" })).toBeVisible();
    await expect(page.getByLabel("结算排序")).toBeVisible();
    await expect(page.getByLabel("批量确认结算")).toBeVisible();
    await expect(page.getByText("待锁定扣罚").first()).toBeVisible();
    await expect(page.getByText("裁决扣减").first()).toBeVisible();
    await page.getByRole("button", { name: "锁定扣罚" }).click();
    await expect(page.getByText("扣罚已锁定").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "财务确认" }).first()).toBeVisible();

    await page.getByRole("button", { name: "资金" }).click();
    await expect(page.getByRole("heading", { name: "资金台账" })).toBeVisible();
    await expect(page.getByText("公共风险储备金").first()).toBeVisible();
    await expect(page.getByText("扣罚入账").first()).toBeVisible();

    await page.getByRole("button", { name: "退出" }).click();
    await page.getByLabel("用户名").fill("lawyer02");
    await page.getByLabel("密码").fill("111111");
    await page.getByRole("button", { name: "进入 Lexos" }).click();
    await page.getByLabel("新密码").fill("11111111");
    await page.getByRole("button", { name: "修改并进入" }).click();

    await page.getByRole("button", { name: "风控" }).click();
    await expect(page.getByRole("heading", { name: "投诉与风控" })).toBeVisible();
    await expect(page.locator("th", { hasText: "48 小时答辩" })).toBeVisible();
    await page.getByLabel(/办案律师答辩.*答辩说明/).fill("已补充补偿测算假设、客户沟通记录和后续整改说明。");
    await page.getByRole("button", { name: "提交答辩" }).click();
    await expect(page.getByText("已提交答辩")).toBeVisible();

    await page.getByRole("button", { name: "我的任务" }).click();
    await expect(page.getByText("交付附件")).toBeVisible();
    await expect(page.getByText("单文件上限 6MB")).toBeVisible();
  });
});
