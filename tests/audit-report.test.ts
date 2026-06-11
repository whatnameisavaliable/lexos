import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { demoAuditLogs } from "../src/lib/demo-data.ts";
import { buildAuditReport, type AuditReportLog } from "../src/lib/audit/report.ts";

const logs: AuditReportLog[] = [
  {
    actor: "系统",
    action: "登录失败 lawyer01",
    actionCode: "auth.login_failed",
    entityType: "auth",
    createdAt: "2026-06-10 09:00",
    rawCreatedAt: "2026-06-10T01:00:00.000Z",
  },
  {
    actor: "周律师",
    action: "发布任务",
    actionCode: "tasks.create",
    entityType: "tasks",
    createdAt: "2026-06-10 09:10",
    rawCreatedAt: "2026-06-10T01:10:00.000Z",
  },
  {
    actor: "林律师",
    action: "抢单",
    actionCode: "tasks.claim",
    entityType: "tasks",
    createdAt: "2026-06-11 10:00",
    rawCreatedAt: "2026-06-11T02:00:00.000Z",
  },
  {
    actor: "客户",
    action: "客户确认",
    actionCode: "customer_portal.feedback",
    entityType: "customer_portal",
    createdAt: "2026-06-11 11:00",
    rawCreatedAt: "2026-06-11T03:00:00.000Z",
  },
] as AuditReportLog[];

describe("审计报表", () => {
  it("汇总总量、操作人、模块和安全事件", () => {
    const report = buildAuditReport(logs);

    assert.equal(report.summary.totalCount, 4);
    assert.equal(report.summary.actorCount, 4);
    assert.equal(report.summary.moduleCount, 3);
    assert.equal(report.summary.failedLoginCount, 1);
    assert.equal(report.summary.securityEventCount, 1);
    assert.equal(report.summary.customerPortalEventCount, 1);
  });

  it("按数量、最近时间和名称排序模块与动作", () => {
    const report = buildAuditReport(logs);

    assert.equal(report.summary.topModule?.key, "tasks");
    assert.equal(report.summary.topModule?.count, 2);
    assert.equal(report.summary.topModule?.sharePercent, 50);
    assert.equal(report.actionStats[0].key, "customer_portal.feedback");
    assert.equal(report.actionStats[0].latestAt, "2026-06-11T03:00:00.000Z");
  });

  it("按日期升序输出审计活动趋势", () => {
    const report = buildAuditReport(logs);

    assert.deepEqual(report.dailyStats, [
      { count: 2, date: "2026-06-10" },
      { count: 2, date: "2026-06-11" },
    ]);
  });

  it("Demo 数据中任务模块是最高频审计模块", () => {
    const report = buildAuditReport(demoAuditLogs);

    assert.equal(report.summary.topModule?.key, "tasks");
    assert.equal(report.summary.topModule?.count, 5);
    assert.equal(report.summary.failedLoginCount, 1);
  });
});
