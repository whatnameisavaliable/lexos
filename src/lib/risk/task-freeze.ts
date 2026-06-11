import {
  riskCaseSeverityLabels,
  riskCaseStatusLabels,
  type RiskCaseSeverity,
  type RiskCaseStatus,
} from "./cases.ts";

export type TaskRiskFreezeCase = {
  committeeDeductionBasisPoints?: number | null;
  committeeDecision?: string | null;
  id: string;
  severity: RiskCaseSeverity;
  status: RiskCaseStatus;
  taskId?: string | null;
  title: string;
};

export type TaskRiskDeductionLockCandidate = {
  basisPoints: number;
  riskCaseId: string;
  title: string;
};

export type TaskRiskFreezeStatus = {
  activeRiskCaseCount: number;
  deductionLockCandidate?: TaskRiskDeductionLockCandidate;
  frozen: boolean;
  highestSeverity?: RiskCaseSeverity;
  riskCaseIds: string[];
  riskCaseTitles: string[];
  summary?: string;
};

const severityOrder: Record<RiskCaseSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function buildTaskRiskFreezeStatus(taskId: string, riskCases: TaskRiskFreezeCase[]): TaskRiskFreezeStatus {
  const activeCases = riskCases.filter((riskCase) => riskCase.taskId === taskId && isActiveTaskRiskCase(riskCase));
  const highestSeverity = activeCases.reduce<RiskCaseSeverity | undefined>((current, riskCase) => {
    if (!current || severityOrder[riskCase.severity] > severityOrder[current]) {
      return riskCase.severity;
    }

    return current;
  }, undefined);
  const riskCaseTitles = activeCases.map((riskCase) => riskCase.title);
  const activeRiskCaseCount = activeCases.length;
  const deductionLockCandidate = activeCases
    .filter(
      (riskCase) =>
        riskCase.committeeDecision === "deduction" &&
        Number.isInteger(riskCase.committeeDeductionBasisPoints) &&
        Number(riskCase.committeeDeductionBasisPoints) > 0,
    )
    .sort((first, second) => Number(second.committeeDeductionBasisPoints) - Number(first.committeeDeductionBasisPoints))[0];

  return {
    activeRiskCaseCount,
    deductionLockCandidate: deductionLockCandidate
      ? {
          basisPoints: Number(deductionLockCandidate.committeeDeductionBasisPoints),
          riskCaseId: deductionLockCandidate.id,
          title: deductionLockCandidate.title,
        }
      : undefined,
    frozen: activeRiskCaseCount > 0,
    highestSeverity,
    riskCaseIds: activeCases.map((riskCase) => riskCase.id),
    riskCaseTitles,
    summary:
      activeRiskCaseCount > 0
        ? `风控冻结：${activeRiskCaseCount} 个未办结工单，最高级别 ${riskCaseSeverityLabels[highestSeverity ?? "low"]}`
        : undefined,
  };
}

export function buildTaskRiskFreezeMap(
  taskIds: string[],
  riskCases: TaskRiskFreezeCase[],
): Map<string, TaskRiskFreezeStatus> {
  return new Map(taskIds.map((taskId) => [taskId, buildTaskRiskFreezeStatus(taskId, riskCases)]));
}

export function formatTaskRiskFreezeError(status: TaskRiskFreezeStatus): string {
  const title = status.riskCaseTitles[0] ? `：${status.riskCaseTitles[0]}` : "";
  const highestSeverityText = status.highestSeverity ? riskCaseSeverityLabels[status.highestSeverity] : "风控";

  return `该任务存在 ${status.activeRiskCaseCount} 个未办结风控工单，最高级别 ${highestSeverityText}${title}。请先在风控页处理完成后再确认结算。`;
}

export function isActiveTaskRiskCase(riskCase: TaskRiskFreezeCase): boolean {
  return Boolean(riskCase.taskId) && riskCase.status !== "resolved";
}

export function taskRiskFreezeStatusText(status: TaskRiskFreezeStatus): string {
  if (!status.frozen) {
    return "无未办结风控";
  }

  const statusText = status.highestSeverity ? riskCaseSeverityLabels[status.highestSeverity] : "风控";
  const titleText = status.riskCaseTitles[0] ? ` · ${status.riskCaseTitles[0]}` : "";

  return `${status.activeRiskCaseCount} 个未办结 · ${statusText}${titleText}`;
}

export function taskRiskCaseStatusLabel(status: RiskCaseStatus): string {
  return riskCaseStatusLabels[status];
}
