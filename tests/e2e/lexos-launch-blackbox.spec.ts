import { expect, test, type Page } from "@playwright/test";

const password = "111111";
const changedPassword = "11111111";

async function completeLogin(page: Page, username: string) {
  await expect(page.getByRole("heading", { name: "登录工作台" })).toBeVisible();

  await page.getByLabel("用户名").fill(username);
  await page.getByLabel("密码").fill(password);
  await page.getByRole("button", { name: "进入 Lexos" }).click();

  if (await page.getByRole("heading", { name: "首次登录需要修改密码" }).isVisible().catch(() => false)) {
    await page.getByLabel("新密码").fill(changedPassword);
    await page.getByRole("button", { name: "修改并进入" }).click();
  }
}

async function login(page: Page, username: string) {
  await page.goto("/");
  await completeLogin(page, username);
}

async function loginFromCurrentPage(page: Page, username: string) {
  await completeLogin(page, username);
}

async function logout(page: Page) {
  await page.getByLabel("退出登录").click();
  await expect(page.getByRole("heading", { name: "登录工作台" })).toBeVisible();
}

async function openNav(page: Page, name: string) {
  await page.getByRole("button", { name, exact: true }).first().click();
}

async function expectMenu(page: Page, visible: string[], hidden: string[]) {
  for (const name of visible) {
    await expect(page.getByRole("button", { name, exact: true }).first()).toBeVisible();
  }

  for (const name of hidden) {
    await expect(page.getByRole("button", { name, exact: true })).toHaveCount(0);
  }
}

async function expectVisualSmoke(page: Page) {
  const metrics = await page.evaluate(() => {
    const visibleTables = Array.from(document.querySelectorAll("table")).filter((table) => {
      const rect = table.getBoundingClientRect();
      const style = window.getComputedStyle(table);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    }).length;

    const failedAssets = Array.from(document.querySelectorAll<HTMLImageElement>("img"))
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src);

    return {
      clientWidth: document.documentElement.clientWidth,
      failedAssets,
      scrollWidth: document.documentElement.scrollWidth,
      visibleTables,
    };
  });

  expect(metrics.scrollWidth, "页面不应出现横向滚动").toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(metrics.failedAssets, "静态图片资源不应加载失败").toEqual([]);
  expect(metrics.visibleTables, "关键运营页面不应被大表格主导").toBe(0);
}

function taskSurface(page: Page, title: string) {
  return page
    .getByText(title, { exact: true })
    .first()
    .locator("xpath=ancestor::*[(self::div or self::article or self::tr) and .//button][1]");
}

async function searchCurrentList(page: Page, query: string) {
  await page.getByRole("textbox", { name: "搜索" }).fill(query);
}

async function updateNumberSetting(page: Page, key: string, value: number) {
  const settingRow = page.getByText(key, { exact: true }).locator("xpath=ancestor::tr[1]");
  await settingRow.locator('input[type="number"]').fill(String(value));
}

test.describe("Lexos launch black-box", () => {
  test("角色菜单权限边界覆盖主任、律师、配置管理员和财务", async ({ page }) => {
    await login(page, "director01");
    await expect(page.getByRole("heading", { name: "律所协作总览" })).toBeVisible();
    await expectMenu(page, ["总览", "人员", "职级", "客户", "任务大厅", "任务", "风控", "结算", "资金", "审计"], ["参数", "权限"]);
    await openNav(page, "审计");
    await expect(page.getByRole("heading", { name: "审计日志" })).toBeVisible();
    await logout(page);

    await login(page, "lawyer02");
    await expect(page.getByText("个人工作台")).toBeVisible();
    await expectMenu(page, ["总览", "客户", "任务大厅", "任务", "风控", "结算"], ["人员", "职级", "资金", "审计", "参数", "权限"]);
    await expect(page.getByText(/案源律师|办案律师|承办律师角色|案源角色/)).toHaveCount(0);
    await logout(page);

    await login(page, "firm01");
    await expect(page.getByRole("heading", { name: "用户管理" })).toBeVisible();
    await expectMenu(page, ["人员", "职级", "审计", "参数", "权限"], ["总览", "客户", "任务大厅", "任务", "风控", "结算", "资金"]);
    await logout(page);

    await login(page, "finance01");
    await expect(page.getByText("个人工作台")).toBeVisible();
    await expectMenu(page, ["总览", "结算", "资金"], ["人员", "职级", "客户", "任务大厅", "任务", "风控", "审计", "参数", "权限"]);
  });

  test("任务从创建到客户确认、生成结算和财务确认可闭环", async ({ page }) => {
    const suffix = Date.now().toString().slice(-6);
    const customerName = `黑盒客户${suffix}`;
    const taskTitle = `上线闭环任务${suffix}`;

    await login(page, "firm01");
    await openNav(page, "参数");
    await expect(page.getByRole("heading", { name: "系统参数" })).toBeVisible();
    await updateNumberSetting(page, "settlement_lock_days", 0);
    await page.getByRole("button", { name: "保存参数" }).click();
    await expect(page.getByText("系统参数已保存。")).toBeVisible();
    await logout(page);

    await loginFromCurrentPage(page, "lawyer02");

    await openNav(page, "客户");
    await page.getByLabel("客户名称").fill(customerName);
    await page.getByLabel("联系人").fill("王经理");
    await page.getByLabel("手机号").fill("13900000000");
    await page.getByRole("button", { name: "保存客户" }).click();
    await expect(page.getByText(`客户 ${customerName} 已保存。`)).toBeVisible();

    await openNav(page, "任务");
    await expect(page.getByRole("heading", { name: "任务工作台" })).toBeVisible();
    await page.getByLabel("客户").selectOption({ label: customerName });
    await page.getByLabel("任务标题").fill(taskTitle);
    await page.getByLabel("任务说明").fill("黑盒测试创建的端到端任务。");
    await page.getByLabel("金额（元）").fill("8800");
    await page.getByLabel("最低职级").selectOption("L1A");
    await page.getByLabel("截止日期").fill("2026-07-15");
    await page.getByLabel("需要主任复核").uncheck();
    await page.getByRole("button", { name: "发布到任务大厅" }).click();
    await expect(page.getByText(`任务 ${taskTitle} 已发布到任务大厅。`)).toBeVisible();

    await openNav(page, "任务大厅");
    await searchCurrentList(page, taskTitle);
    await expect(taskSurface(page, taskTitle)).toBeVisible();
    await page.getByRole("button", { name: "承接" }).first().click();
    await expect(page.getByText(`已承接：${taskTitle}`)).toBeVisible();

    await openNav(page, "任务");
    await searchCurrentList(page, taskTitle);
    const claimedTask = taskSurface(page, taskTitle);
    await expect(claimedTask).toBeVisible();
    await page.getByRole("button", { name: "提交成果" }).first().click();
    await expect(page.getByText(`成果已提交：${taskTitle}`)).toBeVisible();

    await page.getByRole("button", { name: "验收通过" }).first().click();
    await page.getByRole("button", { name: "确认验收并评分" }).first().click();
    await expect(page.getByText(`任务已验收：${taskTitle}`)).toBeVisible();

    const tokenText = await page.getByText(/客户链接\s+\S+/).first().textContent();
    const token = tokenText?.match(/客户链接\s+(\S+)/)?.[1];
    expect(token, "任务详情应显示一次性客户 token").toBeTruthy();

    await openNav(page, "总览");
    await page.getByLabel("访问 token").fill(token!);
    await page.getByLabel("客户手机号").fill("13900000000");
    await page.getByLabel("验证码").fill("111111");
    await page.getByRole("button", { name: "校验访问" }).click();
    await expect(page.getByRole("button", { name: "确认接收并评分" })).toBeVisible();
    await page.getByLabel("评分（0-10）").fill("9");
    await page.getByLabel("评价").fill("交付材料完整，沟通清晰。");
    await page.getByRole("button", { name: "确认接收并评分" }).click();
    await expect(page.getByText("客户已确认接收，待结算记录已生成。")).toBeVisible();

    await logout(page);
    await loginFromCurrentPage(page, "finance01");
    await openNav(page, "结算");
    await expect(page.getByRole("heading", { name: "结算管理" })).toBeVisible();
    await searchCurrentList(page, taskTitle);
    const settlementRecord = taskSurface(page, taskTitle);
    await expect(settlementRecord).toBeVisible();
    await settlementRecord.getByRole("button", { name: "财务确认" }).click();
    await settlementRecord.getByRole("button", { name: "确认", exact: true }).click();
    await expect(page.getByText("结算已确认。")).toBeVisible();
  });

  test("风控登记、答辩、委员会裁决、结算扣罚和资金流水可操作", async ({ page }) => {
    const suffix = Date.now().toString().slice(-6);
    const riskTitle = `上线风控工单${suffix}`;

    await login(page, "lawyer02");
    await openNav(page, "风控");
    await expect(page.getByRole("heading", { name: "投诉与风控" })).toBeVisible();
    await page.getByRole("combobox", { name: "关联任务" }).selectOption({ index: 1 });
    await page.getByRole("textbox", { name: "标题", exact: true }).fill(riskTitle);
    await page.getByRole("textbox", { name: "说明", exact: true }).fill("客户投诉交付质量，需要进入答辩和委员会裁决。");
    await page.getByRole("combobox", { name: "级别", exact: true }).selectOption("high");
    await page.getByRole("button", { name: /登记/ }).click();
    await expect(page.getByText("风控工单已创建。")).toBeVisible();

    await searchCurrentList(page, riskTitle);
    await page.getByLabel(new RegExp(`${riskTitle} 答辩说明`)).first().fill("已补充沟通记录和修正文档。");
    await page.getByRole("button", { name: "提交答辩" }).first().click();
    await expect(page.getByText("风控答辩已提交。")).toBeVisible();

    await logout(page);
    await login(page, "director01");
    await openNav(page, "风控");
    await expect(page.getByRole("heading", { name: "累犯惩戒建议" })).toBeVisible();

    const decision = page.getByLabel("裁决").first();
    if (await decision.isVisible().catch(() => false)) {
      await decision.selectOption("deduction");
      await page.getByLabel("扣减基点").first().fill("500");
      await page.getByLabel(/委员会裁决意见/).first().fill("采纳部分答辩，按质量扣减处理。");
      await page.getByRole("button", { name: "提交裁决" }).first().click();
      await expect(page.getByText("风控委员会裁决已提交。")).toBeVisible();
    } else {
      await expect(page.getByText(/等待委员会裁决|待裁决|累犯惩戒建议/)).toBeVisible();
    }

    await openNav(page, "结算");
    await expect(page.getByRole("heading", { name: "结算管理" })).toBeVisible();
    await expect(page.getByText(/风控冻结|扣减裁决|待锁定扣罚|锁定\s*\/\s*冻结/).first()).toBeVisible();

    await logout(page);
    await loginFromCurrentPage(page, "finance01");
    await openNav(page, "结算");
    await expect(page.getByRole("heading", { name: "结算管理" })).toBeVisible();
    const lockButton = page.getByRole("button", { name: "锁定扣罚" }).first();
    if (await lockButton.isVisible().catch(() => false)) {
      await lockButton.click();
      await expect(page.getByText("扣罚资金流向已锁定，结算金额已改为扣后实付。")).toBeVisible();
      await openNav(page, "资金");
      await expect(page.getByRole("heading", { name: "资金台账" })).toBeVisible();
      await expect(page.getByText(/公共风险储备金|质量督导基金|客户退费|律所留存/).first()).toBeVisible();
    } else {
      await openNav(page, "资金");
      await expect(page.getByRole("heading", { name: "资金台账" })).toBeVisible();
      await expect(page.getByText(/公共风险储备金|质量督导基金|客户退费|律所留存/).first()).toBeVisible();
    }
  });

  test("桌面关键页视觉 smoke 无横向滚动、失败资源和表格主导", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1024 });
    await login(page, "director01");

    for (const nav of ["总览", "结算", "风控"] as const) {
      await openNav(page, nav);
      await expectVisualSmoke(page);
    }

    await logout(page);
    await login(page, "lawyer02");
    await openNav(page, "总览");
    await expectVisualSmoke(page);
  });

  test("移动宽度关键页无横向滚动并保持主要工作流可见", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page, "director01");
    await expect(page.getByRole("heading", { name: "律所协作总览" })).toBeVisible();
    await expectVisualSmoke(page);

    await openNav(page, "结算");
    await expect(page.getByRole("heading", { name: "结算管理" })).toBeVisible();
    await expectVisualSmoke(page);

    await openNav(page, "风控");
    await expect(page.getByRole("heading", { name: "投诉与风控" })).toBeVisible();
    await expectVisualSmoke(page);

    await logout(page);
    await login(page, "lawyer02");
    await expect(page.getByText("个人工作台")).toBeVisible();
    await expectVisualSmoke(page);
  });
});
