import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { demoRiskCases, demoTasks, demoUsers } from "../src/lib/demo-data.ts";
import {
  buildRepeatDisciplineStats,
  summarizeRepeatDisciplineStats,
  type RepeatDisciplineRiskCase,
} from "../src/lib/risk/repeat-discipline.ts";

const now = new Date("2026-06-10T12:00:00.000Z");
const users = [
  { displayName: "林律师", id: "u-1", rankCode: "L2B", role: "handling_lawyer", username: "lawyer01" },
  { displayName: "赵律师", id: "u-2", rankCode: "L3A", role: "handling_lawyer", username: "lawyer02" },
];
const tasks = [
  { assignedLawyerId: "u-1", id: "t-1", title: "买卖合同纠纷" },
  { assignedLawyerId: "u-1", id: "t-2", title: "建设工程争议" },
  { assignedLawyerId: "u-2", id: "t-3", title: "数据合规专项" },
];

describe("累犯加重惩戒建议", () => {
  it("近 90 天内两条高/重大有效风控进入限制建议", () => {
    const stats = buildRepeatDisciplineStats({
      now,
      riskCases: [
        riskCase({ id: "r-1", severity: "high", status: "in_review", taskId: "t-1" }),
        riskCase({ id: "r-2", severity: "critical", status: "resolved", taskId: "t-2" }),
      ],
      tasks,
      users,
    });
    const stat = stats.find((item) => item.lawyerId === "u-1");

    assert.equal(stat?.level, "restriction");
    assert.equal(stat?.effectiveCaseCount, 2);
    assert.equal(stat?.highOrCriticalCaseCount, 2);
    assert.match(stat?.suggestedAction ?? "", /限制/);
  });

  it("三条有效风控或升级裁决进入管理层升级复盘建议", () => {
    const stats = buildRepeatDisciplineStats({
      now,
      riskCases: [
        riskCase({ id: "r-1", severity: "high", status: "resolved", taskId: "t-1" }),
        riskCase({ id: "r-2", severity: "medium", status: "resolved", taskId: "t-2", committeeDecision: "warning" }),
        riskCase({ id: "r-3", severity: "medium", status: "in_review", taskId: "t-1", committeeDecision: "escalation" }),
      ],
      tasks,
      users,
    });
    const stat = stats.find((item) => item.lawyerId === "u-1");
    const summary = summarizeRepeatDisciplineStats(stats);

    assert.equal(stat?.level, "escalation");
    assert.equal(summary.escalationCount, 1);
    assert.equal(summary.actionableLawyerCount, 1);
  });

  it("无过错、低中风险且无不利裁决、超出观察期的工单不计入惩戒建议", () => {
    const stats = buildRepeatDisciplineStats({
      now,
      riskCases: [
        riskCase({ id: "r-1", severity: "critical", status: "resolved", taskId: "t-1", committeeDecision: "no_fault" }),
        riskCase({ id: "r-2", severity: "medium", status: "open", taskId: "t-1" }),
        riskCase({ id: "r-3", rawCreatedAt: "2025-12-01T00:00:00.000Z", severity: "high", status: "resolved", taskId: "t-1" }),
      ],
      tasks,
      users,
    });
    const stat = stats.find((item) => item.lawyerId === "u-1");

    assert.equal(stat?.level, "clear");
    assert.equal(stat?.effectiveCaseCount, 0);
  });

  it("Demo 数据中 lawyer01 进入累犯限制建议，lawyer02 不进入限制建议", () => {
    const stats = buildRepeatDisciplineStats({
      now,
      riskCases: demoRiskCases,
      tasks: demoTasks,
      users: demoUsers,
    });
    const handler = stats.find((item) => item.lawyerId === "u-handler");
    const junior = stats.find((item) => item.lawyerId === "u-junior");

    assert.equal(handler?.level, "restriction");
    assert.match(handler?.recentCases.map((item) => item.taskTitle ?? item.title).join(" "), /建设工程付款争议谈判包/);
    assert.equal(junior?.level, "clear");
  });
});

function riskCase(input: Partial<RepeatDisciplineRiskCase>): RepeatDisciplineRiskCase {
  return {
    id: input.id ?? "r-test",
    rawCreatedAt: input.rawCreatedAt ?? "2026-06-09T10:00:00.000Z",
    severity: input.severity ?? "high",
    status: input.status ?? "open",
    taskId: input.taskId,
    title: input.title ?? "风控工单",
    committeeDecision: input.committeeDecision,
  };
}
