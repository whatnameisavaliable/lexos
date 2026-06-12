import { canClaimTask, type TaskStatus, type UserRole } from "../domain/core.ts";
import type { RiskCaseSeverity, RiskCaseStatus } from "../risk/cases.ts";

export const CLAIM_BLOCKING_RISK_SEVERITIES: readonly RiskCaseSeverity[] = ["high", "critical"];
export const CLAIM_BLOCKING_RISK_STATUSES: readonly RiskCaseStatus[] = ["open", "in_review"];

export type ClaimBlockingRiskCase = {
  id: string;
  severity: RiskCaseSeverity;
  status: RiskCaseStatus;
  title: string;
  taskId?: string;
  taskTitle?: string;
};

export type ClaimRiskRestriction = {
  blocked: boolean;
  blockingCaseCount: number;
  blockingCaseTitles: string[];
  highestSeverity?: RiskCaseSeverity;
  reason?: string;
  riskCases: ClaimBlockingRiskCase[];
};

export type ClaimTaskWithRestrictionInput = {
  taskStatus: TaskStatus;
  userRole: UserRole;
  lawyerRankOrder: number;
  minRankOrder: number;
  restriction?: ClaimRiskRestriction;
};

const severityOrder: Record<RiskCaseSeverity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function buildClaimRiskRestriction(riskCases: ClaimBlockingRiskCase[]): ClaimRiskRestriction {
  const blockingCases = riskCases
    .filter(
      (riskCase) =>
        CLAIM_BLOCKING_RISK_STATUSES.includes(riskCase.status) &&
        CLAIM_BLOCKING_RISK_SEVERITIES.includes(riskCase.severity),
    )
    .sort((left, right) => severityOrder[right.severity] - severityOrder[left.severity]);

  const blockingCaseTitles = blockingCases.map((riskCase) => riskCase.taskTitle ?? riskCase.title);
  const highestSeverity = blockingCases[0]?.severity;
  const blocked = blockingCases.length > 0;

  return {
    blocked,
    blockingCaseCount: blockingCases.length,
    blockingCaseTitles,
    highestSeverity,
    reason: blocked ? formatClaimRiskRestrictionReason(blockingCaseTitles, blockingCases.length) : undefined,
    riskCases: blockingCases,
  };
}

export function canClaimTaskWithRestriction(input: ClaimTaskWithRestrictionInput): {
  allowed: boolean;
  reason?: string;
} {
  if (
    !canClaimTask({
      taskStatus: input.taskStatus,
      userRole: input.userRole,
      lawyerRankOrder: input.lawyerRankOrder,
      minRankOrder: input.minRankOrder,
    })
  ) {
    return {
      allowed: false,
      reason: "当前任务不可承接或职级不满足要求",
    };
  }

  if (input.restriction?.blocked) {
    return {
      allowed: false,
      reason: input.restriction.reason ?? "存在未办结严重风控工单，暂不能抢新任务",
    };
  }

  return { allowed: true };
}

function formatClaimRiskRestrictionReason(titles: string[], total: number): string {
  const visibleTitles = titles.slice(0, 2).join("、");
  const overflowText = total > 2 ? ` 等 ${total} 个` : "";

  if (!visibleTitles) {
    return "存在未办结严重或重大风控工单，暂不能抢新任务";
  }

  return `存在 ${total} 个未办结严重或重大风控工单，暂不能抢新任务：${visibleTitles}${overflowText}`;
}
