import type { RiskCaseSeverity, RiskCaseStatus } from "./cases.ts";
import type { RiskCaseCommitteeDecision } from "./committee-decision.ts";
import { isLawyerRole, type UserRole } from "../domain/core.ts";

export const REPEAT_DISCIPLINE_LOOKBACK_DAYS = 90;

export type RepeatDisciplineLevel = "clear" | "watch" | "restriction" | "escalation";

export const repeatDisciplineLevelLabels: Record<RepeatDisciplineLevel, string> = {
  clear: "正常",
  escalation: "升级复盘",
  restriction: "限制建议",
  watch: "单次复盘",
};

export type RepeatDisciplineLawyer = {
  displayName: string;
  id: string;
  rankCode?: string;
  role: string;
  status?: string;
  username?: string;
};

export type RepeatDisciplineTask = {
  assignedLawyerId?: string;
  id: string;
  title?: string;
};

export type RepeatDisciplineRiskCase = {
  committeeDecidedAt?: string;
  committeeDecision?: RiskCaseCommitteeDecision;
  createdAt?: string;
  id: string;
  rawCreatedAt?: string;
  resolvedAt?: string;
  severity: RiskCaseSeverity;
  status: RiskCaseStatus;
  taskAssignedLawyerId?: string;
  taskId?: string;
  taskTitle?: string;
  title: string;
  updatedAt?: string;
};

export type RepeatDisciplineCaseSummary = {
  committeeDecision?: RiskCaseCommitteeDecision;
  id: string;
  occurredAt?: string;
  severity: RiskCaseSeverity;
  status: RiskCaseStatus;
  taskTitle?: string;
  title: string;
};

export type RepeatDisciplineStat = {
  activeCaseCount: number;
  adverseDecisionCount: number;
  criticalCaseCount: number;
  effectiveCaseCount: number;
  highOrCriticalCaseCount: number;
  latestOccurredAt?: string;
  lawyerId: string;
  lawyerName: string;
  level: RepeatDisciplineLevel;
  rankCode: string;
  recentCases: RepeatDisciplineCaseSummary[];
  suggestedAction: string;
  username?: string;
};

export type RepeatDisciplineSummary = {
  actionableLawyerCount: number;
  escalationCount: number;
  restrictionCount: number;
  topStat?: RepeatDisciplineStat;
  watchCount: number;
};

const adverseCommitteeDecisions = new Set<RiskCaseCommitteeDecision>(["deduction", "escalation", "warning"]);
const highOrCriticalSeverities = new Set<RiskCaseSeverity>(["critical", "high"]);
const levelOrder: Record<RepeatDisciplineLevel, number> = {
  clear: 0,
  watch: 1,
  restriction: 2,
  escalation: 3,
};

export function buildRepeatDisciplineStats(input: {
  lookbackDays?: number;
  now?: Date;
  riskCases: RepeatDisciplineRiskCase[];
  tasks: RepeatDisciplineTask[];
  users: RepeatDisciplineLawyer[];
}): RepeatDisciplineStat[] {
  const now = input.now ?? new Date();
  const lookbackDays = input.lookbackDays ?? REPEAT_DISCIPLINE_LOOKBACK_DAYS;
  const taskById = new Map(input.tasks.map((task) => [task.id, task]));
  const statsByLawyerId = new Map<string, RepeatDisciplineStat>();

  input.users
    .filter((user) => isLawyerRole(user.role as UserRole))
    .forEach((lawyer) => {
      statsByLawyerId.set(lawyer.id, {
        activeCaseCount: 0,
        adverseDecisionCount: 0,
        criticalCaseCount: 0,
        effectiveCaseCount: 0,
        highOrCriticalCaseCount: 0,
        lawyerId: lawyer.id,
        lawyerName: lawyer.displayName,
        level: "clear",
        rankCode: lawyer.rankCode ?? "未定级",
        recentCases: [],
        suggestedAction: "正常观察",
        username: lawyer.username,
      });
    });

  input.riskCases.forEach((riskCase) => {
    const lawyerId = riskCase.taskAssignedLawyerId ?? (riskCase.taskId ? taskById.get(riskCase.taskId)?.assignedLawyerId : undefined);
    const stat = lawyerId ? statsByLawyerId.get(lawyerId) : undefined;

    if (!stat || !isRepeatDisciplineRiskCase(riskCase)) {
      return;
    }

    const occurredAt = riskCaseOccuredAt(riskCase);

    if (!isWithinLookback(occurredAt, now, lookbackDays)) {
      return;
    }

    stat.effectiveCaseCount += 1;

    if (riskCase.status !== "resolved") {
      stat.activeCaseCount += 1;
    }

    if (highOrCriticalSeverities.has(riskCase.severity)) {
      stat.highOrCriticalCaseCount += 1;
    }

    if (riskCase.severity === "critical") {
      stat.criticalCaseCount += 1;
    }

    if (riskCase.committeeDecision && adverseCommitteeDecisions.has(riskCase.committeeDecision)) {
      stat.adverseDecisionCount += 1;
    }

    stat.latestOccurredAt = latestDateText(stat.latestOccurredAt, occurredAt);
    stat.recentCases.push({
      committeeDecision: riskCase.committeeDecision,
      id: riskCase.id,
      occurredAt,
      severity: riskCase.severity,
      status: riskCase.status,
      taskTitle: riskCase.taskTitle ?? (riskCase.taskId ? taskById.get(riskCase.taskId)?.title : undefined),
      title: riskCase.title,
    });
  });

  statsByLawyerId.forEach((stat) => {
    stat.recentCases.sort((first, second) => parseDateText(second.occurredAt) - parseDateText(first.occurredAt));
    stat.level = decideRepeatDisciplineLevel(stat);
    stat.suggestedAction = repeatDisciplineSuggestedAction(stat);
  });

  return Array.from(statsByLawyerId.values()).sort((first, second) => {
    if (levelOrder[second.level] !== levelOrder[first.level]) {
      return levelOrder[second.level] - levelOrder[first.level];
    }

    if (second.effectiveCaseCount !== first.effectiveCaseCount) {
      return second.effectiveCaseCount - first.effectiveCaseCount;
    }

    return first.lawyerName.localeCompare(second.lawyerName, "zh-CN");
  });
}

export function summarizeRepeatDisciplineStats(stats: RepeatDisciplineStat[]): RepeatDisciplineSummary {
  const actionableStats = stats.filter((stat) => stat.level !== "clear");

  return {
    actionableLawyerCount: actionableStats.length,
    escalationCount: stats.filter((stat) => stat.level === "escalation").length,
    restrictionCount: stats.filter((stat) => stat.level === "restriction").length,
    topStat: actionableStats[0],
    watchCount: stats.filter((stat) => stat.level === "watch").length,
  };
}

function isRepeatDisciplineRiskCase(riskCase: RepeatDisciplineRiskCase): boolean {
  if (riskCase.committeeDecision === "no_fault") {
    return false;
  }

  if (riskCase.committeeDecision && adverseCommitteeDecisions.has(riskCase.committeeDecision)) {
    return true;
  }

  return highOrCriticalSeverities.has(riskCase.severity);
}

function decideRepeatDisciplineLevel(stat: RepeatDisciplineStat): RepeatDisciplineLevel {
  const hasEscalationDecision = stat.recentCases.some((riskCase) => riskCase.committeeDecision === "escalation");

  if (stat.effectiveCaseCount >= 3 || stat.criticalCaseCount >= 2 || hasEscalationDecision) {
    return "escalation";
  }

  if (stat.effectiveCaseCount >= 2 || (stat.highOrCriticalCaseCount >= 1 && stat.adverseDecisionCount >= 1)) {
    return "restriction";
  }

  if (stat.effectiveCaseCount === 1) {
    return "watch";
  }

  return "clear";
}

function repeatDisciplineSuggestedAction(stat: RepeatDisciplineStat): string {
  if (stat.level === "escalation") {
    return "建议提交管理层专项复盘，后续如需降级或学习期应走单独审批";
  }

  if (stat.level === "restriction") {
    return "建议限制高金额或高风险抢单，并由主任复核后恢复";
  }

  if (stat.level === "watch") {
    return "建议完成一次交付复盘并保留处理记录";
  }

  return "正常观察";
}

function riskCaseOccuredAt(riskCase: RepeatDisciplineRiskCase): string | undefined {
  return riskCase.committeeDecidedAt ?? riskCase.resolvedAt ?? riskCase.rawCreatedAt ?? riskCase.updatedAt ?? riskCase.createdAt;
}

function isWithinLookback(value: string | undefined, now: Date, lookbackDays: number): boolean {
  if (!value) {
    return true;
  }

  const occurredAt = parseDateText(value);

  if (!Number.isFinite(occurredAt)) {
    return true;
  }

  return now.getTime() - occurredAt <= lookbackDays * 24 * 60 * 60 * 1000;
}

function latestDateText(current: string | undefined, next: string | undefined): string | undefined {
  if (!current) {
    return next;
  }

  if (!next) {
    return current;
  }

  return parseDateText(next) > parseDateText(current) ? next : current;
}

function parseDateText(value: string | undefined): number {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value.replace(" ", "T"));

  return Number.isFinite(parsed) ? parsed : 0;
}
