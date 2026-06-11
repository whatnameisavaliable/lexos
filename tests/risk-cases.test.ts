import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { demoRiskCases } from "../src/lib/demo-data.ts";
import {
  buildLowScoreRiskCaseDraft,
  normalizeRiskCaseInput,
  normalizeRiskCaseStatusUpdate,
  riskCaseSeverityLabels,
  shouldCreateLowScoreRiskCase,
  transitionRiskCaseStatus,
} from "../src/lib/risk/cases.ts";
import {
  canSubmitCommitteeDecision,
  normalizeRiskCaseCommitteeDecisionInput,
  riskCaseCommitteeDecisionLabels,
} from "../src/lib/risk/committee-decision.ts";
import {
  buildRiskCaseDefenseStatus,
  normalizeRiskCaseDefenseInput,
  riskCaseDefenseDeadline,
} from "../src/lib/risk/defense.ts";
import { buildTaskRiskFreezeStatus, taskRiskFreezeStatusText } from "../src/lib/risk/task-freeze.ts";
import {
  calculateSettlementRiskDeduction,
  canLockSettlementRiskDeduction,
  effectiveSettlementAmountCents,
  riskPenaltyDestinationLabel,
} from "../src/lib/settlements/risk-deduction.ts";

describe("投诉与风控工单", () => {
  it("清理创建输入，并为缺省字段设置第一版默认值", () => {
    const draft = normalizeRiskCaseInput({
      description: "  客户反馈交付说明不完整  ",
      severity: "high",
      source: "customer_complaint",
      title: "  交付质量投诉  ",
    });

    assert.equal(draft.title, "交付质量投诉");
    assert.equal(draft.description, "客户反馈交付说明不完整");
    assert.equal(draft.severity, "high");
    assert.equal(draft.source, "customer_complaint");
    assert.equal(draft.status, "open");
  });

  it("低于或等于 6 分时进入低分风控触发范围", () => {
    assert.equal(shouldCreateLowScoreRiskCase(6), true);
    assert.equal(shouldCreateLowScoreRiskCase(7), false);
    assert.equal(shouldCreateLowScoreRiskCase("bad"), false);
  });

  it("根据低分构造工单标题和严重程度", () => {
    const draft = buildLowScoreRiskCaseDraft({
      score: 3,
      scoreLabel: "客户评分",
      taskTitle: "劳动仲裁补偿测算",
    });

    assert.equal(draft.source, "low_score");
    assert.equal(draft.severity, "high");
    assert.match(draft.title, /客户评分 3 分/);
  });

  it("按动作推进风控状态，并要求办结意见", () => {
    assert.equal(transitionRiskCaseStatus("open", "start_review"), "in_review");
    assert.equal(transitionRiskCaseStatus("in_review", "resolve"), "resolved");
    assert.equal(transitionRiskCaseStatus("resolved", "reopen"), "in_review");

    const update = normalizeRiskCaseStatusUpdate(
      {
        action: "resolve",
        resolutionNote: "已复核交付材料并完成客户说明。",
      },
      "in_review",
    );

    assert.equal(update.nextStatus, "resolved");
    assert.equal(update.resolutionNote, "已复核交付材料并完成客户说明。");
    assert.throws(() => normalizeRiskCaseStatusUpdate({ action: "resolve" }, "in_review"), /处理意见/);
    assert.throws(() => transitionRiskCaseStatus("resolved", "resolve"), /当前状态不能执行/);
  });

  it("未办结风控工单会冻结对应任务结算金额", () => {
    const frozen = buildTaskRiskFreezeStatus("t-100", [
      {
        id: "r-100",
        severity: "critical",
        status: "in_review",
        taskId: "t-100",
        title: "客户重大投诉",
      },
      {
        id: "r-101",
        severity: "low",
        status: "resolved",
        taskId: "t-100",
        title: "历史提醒",
      },
    ]);

    assert.equal(frozen.frozen, true);
    assert.equal(frozen.activeRiskCaseCount, 1);
    assert.equal(frozen.highestSeverity, "critical");
    assert.match(taskRiskFreezeStatusText(frozen), /客户重大投诉/);

    const clear = buildTaskRiskFreezeStatus("t-200", [
      {
        id: "r-102",
        severity: "high",
        status: "resolved",
        taskId: "t-200",
        title: "已办结投诉",
      },
    ]);

    assert.equal(clear.frozen, false);
  });

  it("按工单创建时间计算 48 小时答辩期限", () => {
    const deadline = riskCaseDefenseDeadline("2026-06-09T01:00:00.000Z");
    const status = buildRiskCaseDefenseStatus({
      createdAt: "2026-06-09T01:00:00.000Z",
      now: new Date("2026-06-10T00:30:00.000Z"),
      status: "open",
    });

    assert.equal(deadline?.toISOString(), "2026-06-11T01:00:00.000Z");
    assert.equal(status.canSubmit, true);
    assert.equal(status.hoursRemaining, 25);
    assert.equal(status.overdue, false);
  });

  it("超时、已提交或已办结的工单不能继续答辩", () => {
    const overdue = buildRiskCaseDefenseStatus({
      createdAt: "2026-06-09T01:00:00.000Z",
      now: new Date("2026-06-12T00:00:00.000Z"),
      status: "open",
    });
    const submitted = buildRiskCaseDefenseStatus({
      createdAt: "2026-06-09T01:00:00.000Z",
      defendedAt: "2026-06-09T03:00:00.000Z",
      now: new Date("2026-06-09T04:00:00.000Z"),
      status: "open",
    });
    const resolved = buildRiskCaseDefenseStatus({
      createdAt: "2026-06-09T01:00:00.000Z",
      now: new Date("2026-06-09T04:00:00.000Z"),
      status: "resolved",
    });

    assert.equal(overdue.canSubmit, false);
    assert.equal(overdue.overdue, true);
    assert.equal(submitted.canSubmit, false);
    assert.equal(submitted.submitted, true);
    assert.equal(resolved.canSubmit, false);
  });

  it("清理答辩说明并拒绝空内容", () => {
    assert.deepEqual(normalizeRiskCaseDefenseInput({ defenseStatement: "  已补充测算依据。 " }), {
      defenseStatement: "已补充测算依据。",
    });
    assert.throws(() => normalizeRiskCaseDefenseInput({ defenseStatement: "   " }), /答辩说明/);
  });

  it("清理委员会裁决并决定后续状态", () => {
    const warning = normalizeRiskCaseCommitteeDecisionInput({
      decision: "warning",
      note: "采纳答辩，记录警示并办结。",
    });
    const deduction = normalizeRiskCaseCommitteeDecisionInput({
      decision: "deduction",
      deductionBasisPoints: 1500,
      note: "部分未采纳答辩，建议扣减。",
    });

    assert.equal(warning.nextStatus, "resolved");
    assert.equal(warning.deductionBasisPoints, 0);
    assert.equal(deduction.nextStatus, "in_review");
    assert.equal(deduction.deductionBasisPoints, 1500);
    assert.equal(riskCaseCommitteeDecisionLabels.deduction, "扣减裁决");
    assert.throws(
      () => normalizeRiskCaseCommitteeDecisionInput({ decision: "deduction", deductionBasisPoints: 0, note: "扣减" }),
      /扣减裁决/,
    );
  });

  it("委员会裁决需要等待答辩提交或 48 小时到期", () => {
    assert.equal(
      canSubmitCommitteeDecision({
        defenseOverdue: false,
        defenseSubmitted: false,
        status: "open",
      }).allowed,
      false,
    );
    assert.equal(
      canSubmitCommitteeDecision({
        defenseOverdue: false,
        defenseSubmitted: true,
        status: "open",
      }).allowed,
      true,
    );
    assert.equal(
      canSubmitCommitteeDecision({
        defenseOverdue: true,
        defenseSubmitted: false,
        status: "open",
      }).allowed,
      true,
    );
    assert.equal(
      canSubmitCommitteeDecision({
        defenseOverdue: true,
        defenseSubmitted: false,
        existingDecision: "warning",
        status: "open",
      }).allowed,
      false,
    );
  });

  it("扣罚资金流向锁定前校验扣减裁决，并计算律师实付金额", () => {
    const calculation = calculateSettlementRiskDeduction(2_520_000, 1500);

    assert.equal(calculation.deductionAmountCents, 378_000);
    assert.equal(calculation.payableAmountCents, 2_142_000);
    assert.equal(effectiveSettlementAmountCents({ settlementAmountCents: 2_520_000, payableAmountCents: 2_142_000 }), 2_142_000);
    assert.equal(riskPenaltyDestinationLabel("quality_fund"), "质量督导基金");
    assert.equal(
      canLockSettlementRiskDeduction({
        deductionBasisPoints: 1500,
        existingLockedAt: null,
        riskCaseDecision: "deduction",
        riskCaseStatus: "in_review",
        settlementStatus: "pending",
      }).allowed,
      true,
    );
    assert.equal(
      canLockSettlementRiskDeduction({
        deductionBasisPoints: 0,
        riskCaseDecision: "deduction",
        riskCaseStatus: "in_review",
        settlementStatus: "pending",
      }).allowed,
      false,
    );
  });

  it("演示数据包含投诉、低分和已处理样例", () => {
    assert.equal(demoRiskCases.some((item) => item.source === "customer_complaint"), true);
    assert.equal(demoRiskCases.some((item) => item.source === "low_score"), true);
    assert.equal(demoRiskCases.some((item) => item.status === "resolved"), true);
    assert.equal(demoRiskCases.some((item) => item.resolutionNote), true);
    assert.equal(demoRiskCases.some((item) => item.taskAssignedLawyerId && !item.defendedAt), true);
    assert.equal(demoRiskCases.some((item) => item.defendedAt && !item.committeeDecision), true);
    assert.equal(demoRiskCases.some((item) => item.taskId === "t-005" && item.committeeDecision === "deduction"), true);
    assert.equal(buildTaskRiskFreezeStatus("t-005", demoRiskCases).frozen, true);
    assert.equal(buildTaskRiskFreezeStatus("t-005", demoRiskCases).deductionLockCandidate?.basisPoints, 1500);
    assert.equal(riskCaseSeverityLabels.critical, "四级重大");
  });
});
