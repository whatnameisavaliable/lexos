import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildPersonalWorkbench } from "../src/lib/analytics/personal-workbench.ts";
import { demoFeedback, demoSettlements, demoTasks, demoUsers } from "../src/lib/demo-data.ts";

function demoUser(id: string) {
  const user = demoUsers.find((item) => item.id === id);

  assert.ok(user);

  return user;
}

describe("律师个人工作台", () => {
  it("办案律师看到自己的已接单待提交任务", () => {
    const summary = buildPersonalWorkbench({
      currentUser: demoUser("u-junior"),
      feedback: demoFeedback,
      settlements: demoSettlements,
      tasks: demoTasks,
    });

    assert.equal(summary.title, "吴青年律师的个人工作台");
    assert.equal(summary.metrics.find((metric) => metric.label === "我的任务")?.value, "2");
    assert.equal(summary.metrics.find((metric) => metric.label === "待处理")?.value, "1");
    assert.equal(summary.metrics.find((metric) => metric.label === "综合评分")?.value, "8/10");
    assert.ok(summary.actions.some((action) => action.title.includes("提交成果：劳动争议证据梳理")));
  });

  it("案源律师看到自己发布任务中的待验收成果", () => {
    const summary = buildPersonalWorkbench({
      currentUser: demoUser("u-source"),
      feedback: demoFeedback,
      settlements: demoSettlements,
      tasks: demoTasks,
    });

    assert.equal(summary.metrics.find((metric) => metric.label === "我发布的任务")?.value, "5");
    assert.equal(summary.metrics.find((metric) => metric.label === "待处理")?.value, "1");
    assert.ok(summary.actions.some((action) => action.title.includes("验收任务：买卖合同纠纷诉前方案")));
  });

  it("财务角色优先看到待确认结算", () => {
    const summary = buildPersonalWorkbench({
      currentUser: demoUser("u-finance"),
      feedback: demoFeedback,
      settlements: demoSettlements,
      tasks: demoTasks,
    });

    assert.equal(summary.metrics.find((metric) => metric.label === "待处理")?.value, "1");
    assert.ok(summary.actions.some((action) => action.title === "确认待结算"));
  });
});
