import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { demoRiskCases, demoTasks } from "../src/lib/demo-data.ts";
import {
  buildClaimRiskRestriction,
  canClaimTaskWithRestriction,
  type ClaimBlockingRiskCase,
} from "../src/lib/tasks/claim-restrictions.ts";

describe("承接权限限制", () => {
  it("存在未办结高风险或重大风控工单时暂停抢新任务", () => {
    const restriction = buildClaimRiskRestriction([
      riskCase({ id: "r-1", severity: "high", status: "open", title: "交付质量投诉" }),
      riskCase({ id: "r-2", severity: "medium", status: "open", title: "一般提醒" }),
      riskCase({ id: "r-3", severity: "critical", status: "resolved", title: "已办结重大投诉" }),
    ]);

    assert.equal(restriction.blocked, true);
    assert.equal(restriction.blockingCaseCount, 1);
    assert.deepEqual(restriction.blockingCaseTitles, ["交付质量投诉"]);
    assert.match(restriction.reason ?? "", /暂不能抢新任务/);
  });

  it("中低风险或已办结风控工单不影响承接", () => {
    const restriction = buildClaimRiskRestriction([
      riskCase({ id: "r-1", severity: "medium", status: "in_review", title: "一般风控" }),
      riskCase({ id: "r-2", severity: "critical", status: "resolved", title: "已办结重大投诉" }),
    ]);

    assert.equal(restriction.blocked, false);
    assert.equal(restriction.blockingCaseCount, 0);
  });

  it("基础承接条件满足但风控限制存在时仍会拒绝", () => {
    const permission = canClaimTaskWithRestriction({
      lawyerRankOrder: 6,
      minRankOrder: 4,
      restriction: buildClaimRiskRestriction([riskCase({ id: "r-1", severity: "critical", status: "in_review" })]),
      taskStatus: "open",
      userRole: "lawyer",
    });

    assert.equal(permission.allowed, false);
    assert.match(permission.reason ?? "", /风控/);
  });

  it("Demo 样例中 lawyer01 被严重未结风控暂停，lawyer02 不被中等风控暂停", () => {
    const restrictionForLawyer01 = buildRestrictionForDemoUser("u-handler");
    const restrictionForLawyer02 = buildRestrictionForDemoUser("u-junior");

    assert.equal(restrictionForLawyer01.blocked, true);
    assert.match(restrictionForLawyer01.reason ?? "", /建设工程付款争议谈判包/);
    assert.equal(restrictionForLawyer02.blocked, false);
  });
});

function riskCase(input: Partial<ClaimBlockingRiskCase>): ClaimBlockingRiskCase {
  return {
    id: input.id ?? "r-test",
    severity: input.severity ?? "high",
    status: input.status ?? "open",
    title: input.title ?? "重大风控工单",
  };
}

function buildRestrictionForDemoUser(userId: string) {
  const assignedTaskIds = new Set(demoTasks.filter((task) => task.assignedLawyerId === userId).map((task) => task.id));

  return buildClaimRiskRestriction(
    demoRiskCases
      .filter((riskCase) => riskCase.taskAssignedLawyerId === userId || Boolean(riskCase.taskId && assignedTaskIds.has(riskCase.taskId)))
      .map((riskCase) => ({
        id: riskCase.id,
        severity: riskCase.severity,
        status: riskCase.status,
        taskId: riskCase.taskId,
        taskTitle: riskCase.taskTitle,
        title: riskCase.title,
      })),
  );
}
