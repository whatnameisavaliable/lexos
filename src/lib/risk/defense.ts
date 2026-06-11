import type { RiskCaseStatus } from "./cases.ts";

export const RISK_CASE_DEFENSE_WINDOW_HOURS = 48;
const RISK_CASE_DEFENSE_MAX_LENGTH = 2000;

export type RiskCaseDefenseInput = {
  defenseStatement?: unknown;
};

export type RiskCaseDefense = {
  defenseStatement: string;
};

export type RiskCaseDefenseStatus = {
  canSubmit: boolean;
  deadlineAt: Date | null;
  hoursRemaining: number;
  overdue: boolean;
  submitted: boolean;
};

export function normalizeRiskCaseDefenseInput(input: RiskCaseDefenseInput): RiskCaseDefense {
  if (typeof input.defenseStatement !== "string" || !input.defenseStatement.trim()) {
    throw new Error("答辩说明不能为空");
  }

  return {
    defenseStatement: input.defenseStatement.trim().slice(0, RISK_CASE_DEFENSE_MAX_LENGTH),
  };
}

export function riskCaseDefenseDeadline(createdAt: string | null | undefined): Date | null {
  if (!createdAt) {
    return null;
  }

  const createdDate = new Date(createdAt);

  if (Number.isNaN(createdDate.getTime())) {
    return null;
  }

  return new Date(createdDate.getTime() + RISK_CASE_DEFENSE_WINDOW_HOURS * 60 * 60 * 1000);
}

export function buildRiskCaseDefenseStatus(input: {
  createdAt?: string | null;
  defendedAt?: string | null;
  now?: Date;
  status: RiskCaseStatus;
}): RiskCaseDefenseStatus {
  const deadlineAt = riskCaseDefenseDeadline(input.createdAt);
  const now = input.now ?? new Date();
  const remainingMs = deadlineAt ? deadlineAt.getTime() - now.getTime() : 0;
  const submitted = Boolean(input.defendedAt);
  const overdue = Boolean(deadlineAt && remainingMs <= 0);

  return {
    canSubmit: input.status !== "resolved" && !submitted && !overdue && Boolean(deadlineAt),
    deadlineAt,
    hoursRemaining: remainingMs > 0 ? Math.max(1, Math.ceil(remainingMs / (60 * 60 * 1000))) : 0,
    overdue,
    submitted,
  };
}
