import type { RiskCaseStatus } from "./cases.ts";

export type RiskCaseCommitteeDecision = "no_fault" | "warning" | "deduction" | "escalation";

export type RiskCaseCommitteeDecisionInput = {
  decision?: unknown;
  deductionBasisPoints?: unknown;
  note?: unknown;
};

export type NormalizedRiskCaseCommitteeDecision = {
  decision: RiskCaseCommitteeDecision;
  deductionBasisPoints: number;
  nextStatus: RiskCaseStatus;
  note: string;
};

export const riskCaseCommitteeDecisionLabels: Record<RiskCaseCommitteeDecision, string> = {
  deduction: "扣减裁决",
  escalation: "升级处理",
  no_fault: "无过错",
  warning: "警示记录",
};

const committeeDecisions = new Set<RiskCaseCommitteeDecision>(["no_fault", "warning", "deduction", "escalation"]);

export function normalizeRiskCaseCommitteeDecisionInput(
  input: RiskCaseCommitteeDecisionInput,
): NormalizedRiskCaseCommitteeDecision {
  const decision = normalizeDecision(input.decision);
  const note = requiredText(input.note, "裁决意见", 1200);
  const deductionBasisPoints = normalizeDeductionBasisPoints(input.deductionBasisPoints, decision);

  return {
    decision,
    deductionBasisPoints,
    nextStatus: decision === "no_fault" || decision === "warning" ? "resolved" : "in_review",
    note,
  };
}

export function canSubmitCommitteeDecision(input: {
  defenseOverdue: boolean;
  defenseSubmitted: boolean;
  existingDecision?: string | null;
  status: RiskCaseStatus;
}): { allowed: boolean; reason?: string } {
  if (input.existingDecision) {
    return { allowed: false, reason: "该风控工单已有委员会裁决" };
  }

  if (input.status === "resolved") {
    return { allowed: false, reason: "已办结风控工单不能再次裁决" };
  }

  if (!input.defenseSubmitted && !input.defenseOverdue) {
    return { allowed: false, reason: "办案律师 48 小时答辩期未结束" };
  }

  return { allowed: true };
}

function normalizeDecision(value: unknown): RiskCaseCommitteeDecision {
  if (typeof value === "string" && committeeDecisions.has(value as RiskCaseCommitteeDecision)) {
    return value as RiskCaseCommitteeDecision;
  }

  throw new Error("委员会裁决类型不正确");
}

function normalizeDeductionBasisPoints(value: unknown, decision: RiskCaseCommitteeDecision): number {
  if (decision !== "deduction") {
    return 0;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 10000) {
    throw new Error("扣减裁决必须填写 1 到 10000 之间的扣减比例基点");
  }

  return parsed;
}

function requiredText(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label}不能为空`);
  }

  return value.trim().slice(0, maxLength);
}
