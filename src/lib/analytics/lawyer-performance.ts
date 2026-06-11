import type { CustomerFeedback, DemoUser, Settlement, Task } from "../../types/demo.ts";
import { isLawyerRole } from "../domain/core.ts";
import { averageScores } from "../reviews/source-review.ts";
import { effectiveSettlementAmountCents } from "../settlements/risk-deduction.ts";

export type LawyerPerformanceStat = {
  activeTaskCount: number;
  averageScore: number | null;
  caseResultAverageScore: number | null;
  caseResultCount: number;
  completedTaskCount: number;
  confirmedSettlementAmountCents: number;
  feedbackCount: number;
  inProgressTaskCount: number;
  lawyerId: string;
  lawyerName: string;
  rankCode: string;
  rollingAverageScore: number | null;
  rollingTaskCount: number;
  settlementAmountCents: number;
  sourceReviewAverageScore: number | null;
  sourceReviewCount: number;
  taskAmountCents: number;
  totalTaskCount: number;
  username: string;
};

export type LawyerPerformanceSummary = {
  activeLawyerCount: number;
  averageScore: number | null;
  caseResultAverageScore: number | null;
  completedTaskCount: number;
  confirmedSettlementAmountCents: number;
  inProgressTaskCount: number;
  lawyerCount: number;
  rollingAverageScore: number | null;
  rollingTaskCount: number;
  settlementAmountCents: number;
  sourceReviewAverageScore: number | null;
  taskAmountCents: number;
  topLawyer?: LawyerPerformanceStat;
};

type BuildLawyerPerformanceStatsInput = {
  feedback: CustomerFeedback[];
  settlements: Settlement[];
  tasks: Task[];
  users: DemoUser[];
};

const activeTaskStatuses = new Set(["claimed", "submitted", "approved", "customer_confirmed", "settlement_pending", "settled"]);
const completedTaskStatuses = new Set(["customer_confirmed", "settlement_pending", "settled"]);
const inProgressTaskStatuses = new Set(["claimed", "submitted", "approved"]);

export function buildLawyerPerformanceStats({
  feedback,
  settlements,
  tasks,
  users,
}: BuildLawyerPerformanceStatsInput): LawyerPerformanceStat[] {
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const statsByLawyerId = new Map<string, LawyerPerformanceStat>();
  const scoresByLawyerId = new Map<string, number[]>();
  const sourceReviewScoresByLawyerId = new Map<string, number[]>();
  const caseResultScoresByLawyerId = new Map<string, number[]>();
  const rollingScoreEntriesByLawyerId = new Map<string, RollingScoreEntry[]>();

  users
    .filter((user) => isLawyerRole(user.role))
    .forEach((lawyer) => {
      statsByLawyerId.set(lawyer.id, createLawyerStat(lawyer));
    });

  tasks.forEach((task) => {
    if (!task.assignedLawyerId) {
      return;
    }

    const stat = statsByLawyerId.get(task.assignedLawyerId);

    if (!stat) {
      return;
    }

    stat.totalTaskCount += 1;

    if (!activeTaskStatuses.has(task.status)) {
      return;
    }

    stat.activeTaskCount += 1;
    stat.taskAmountCents += task.amountCents;

    if (completedTaskStatuses.has(task.status)) {
      stat.completedTaskCount += 1;
    }

    if (inProgressTaskStatuses.has(task.status)) {
      stat.inProgressTaskCount += 1;
    }

    pushTaskScore(sourceReviewScoresByLawyerId, task.assignedLawyerId, task.sourceReviewScore);
    pushTaskScore(caseResultScoresByLawyerId, task.assignedLawyerId, task.caseResultScore);
    pushRollingScoreEntry(rollingScoreEntriesByLawyerId, task, feedback);
  });

  settlements.forEach((settlement) => {
    const stat = statsByLawyerId.get(settlement.lawyerId);

    if (!stat) {
      return;
    }

    const effectiveAmountCents = effectiveSettlementAmountCents(settlement);

    stat.settlementAmountCents += effectiveAmountCents;

    if (settlement.status === "confirmed") {
      stat.confirmedSettlementAmountCents += effectiveAmountCents;
    }
  });

  feedback.forEach((item) => {
    const task = taskById.get(item.taskId);

    if (!task?.assignedLawyerId || !statsByLawyerId.has(task.assignedLawyerId)) {
      return;
    }

    const scores = scoresByLawyerId.get(task.assignedLawyerId) ?? [];

    scores.push(item.score);
    scoresByLawyerId.set(task.assignedLawyerId, scores);
  });

  scoresByLawyerId.forEach((scores, lawyerId) => {
    const stat = statsByLawyerId.get(lawyerId);

    if (!stat) {
      return;
    }

    stat.feedbackCount = scores.length;
    stat.averageScore = averageScores(scores);
  });

  sourceReviewScoresByLawyerId.forEach((scores, lawyerId) => {
    const stat = statsByLawyerId.get(lawyerId);

    if (!stat) {
      return;
    }

    stat.sourceReviewCount = scores.length;
    stat.sourceReviewAverageScore = averageScores(scores);
  });

  caseResultScoresByLawyerId.forEach((scores, lawyerId) => {
    const stat = statsByLawyerId.get(lawyerId);

    if (!stat) {
      return;
    }

    stat.caseResultCount = scores.length;
    stat.caseResultAverageScore = averageScores(scores);
  });

  rollingScoreEntriesByLawyerId.forEach((entries, lawyerId) => {
    const stat = statsByLawyerId.get(lawyerId);

    if (!stat) {
      return;
    }

    const recentEntries = entries.sort((first, second) => second.scoredAt - first.scoredAt).slice(0, 30);

    stat.rollingTaskCount = recentEntries.length;
    stat.rollingAverageScore = averageNumberScores(recentEntries.flatMap((entry) => entry.scores));
  });

  return Array.from(statsByLawyerId.values()).sort((first, second) => {
    const firstScore = first.averageScore ?? -1;
    const secondScore = second.averageScore ?? -1;

    if (secondScore !== firstScore) {
      return secondScore - firstScore;
    }

    if (second.completedTaskCount !== first.completedTaskCount) {
      return second.completedTaskCount - first.completedTaskCount;
    }

    if (second.taskAmountCents !== first.taskAmountCents) {
      return second.taskAmountCents - first.taskAmountCents;
    }

    return first.lawyerName.localeCompare(second.lawyerName, "zh-CN");
  });
}

export function summarizeLawyerPerformanceStats(stats: LawyerPerformanceStat[]): LawyerPerformanceSummary {
  const feedbackSummary = stats.reduce(
    (summary, stat) => {
      if (stat.averageScore === null) {
        return summary;
      }

      return {
        count: summary.count + stat.feedbackCount,
        total: summary.total + stat.averageScore * stat.feedbackCount,
      };
    },
    { count: 0, total: 0 },
  );

  return {
    activeLawyerCount: stats.filter((stat) => stat.activeTaskCount > 0).length,
    averageScore: feedbackSummary.count ? roundToOne(feedbackSummary.total / feedbackSummary.count) : null,
    caseResultAverageScore: summarizeAverageStat(stats, "caseResultAverageScore", "caseResultCount"),
    completedTaskCount: stats.reduce((sum, item) => sum + item.completedTaskCount, 0),
    confirmedSettlementAmountCents: stats.reduce((sum, item) => sum + item.confirmedSettlementAmountCents, 0),
    inProgressTaskCount: stats.reduce((sum, item) => sum + item.inProgressTaskCount, 0),
    lawyerCount: stats.length,
    rollingAverageScore: summarizeAverageStat(stats, "rollingAverageScore", "rollingTaskCount"),
    rollingTaskCount: stats.reduce((sum, item) => sum + item.rollingTaskCount, 0),
    settlementAmountCents: stats.reduce((sum, item) => sum + item.settlementAmountCents, 0),
    sourceReviewAverageScore: summarizeAverageStat(stats, "sourceReviewAverageScore", "sourceReviewCount"),
    taskAmountCents: stats.reduce((sum, item) => sum + item.taskAmountCents, 0),
    topLawyer: stats[0],
  };
}

function createLawyerStat(lawyer: DemoUser): LawyerPerformanceStat {
  return {
    activeTaskCount: 0,
    averageScore: null,
    caseResultAverageScore: null,
    caseResultCount: 0,
    completedTaskCount: 0,
    confirmedSettlementAmountCents: 0,
    feedbackCount: 0,
    inProgressTaskCount: 0,
    lawyerId: lawyer.id,
    lawyerName: lawyer.displayName,
    rankCode: lawyer.rankCode ?? "未定级",
    rollingAverageScore: null,
    rollingTaskCount: 0,
    settlementAmountCents: 0,
    sourceReviewAverageScore: null,
    sourceReviewCount: 0,
    taskAmountCents: 0,
    totalTaskCount: 0,
    username: lawyer.username,
  };
}

type RollingScoreEntry = {
  scoredAt: number;
  scores: number[];
};

function pushTaskScore(scoresByLawyerId: Map<string, number[]>, lawyerId: string, score?: number) {
  if (!Number.isInteger(score)) {
    return;
  }

  const scores = scoresByLawyerId.get(lawyerId) ?? [];
  const validScore = Number(score);

  scores.push(validScore);
  scoresByLawyerId.set(lawyerId, scores);
}

function pushRollingScoreEntry(scoresByLawyerId: Map<string, RollingScoreEntry[]>, task: Task, feedback: CustomerFeedback[]) {
  if (!task.assignedLawyerId) {
    return;
  }

  const taskFeedback = feedback.find((item) => item.taskId === task.id);
  const scores = [
    taskFeedback?.score,
    task.sourceReviewScore,
    task.caseResultScore,
  ].filter((score): score is number => score !== null && score !== undefined && Number.isFinite(score) && score >= 1 && score <= 10);

  if (!scores.length) {
    return;
  }

  const entries = scoresByLawyerId.get(task.assignedLawyerId) ?? [];

  entries.push({
    scoredAt: scoreTime(task, taskFeedback),
    scores,
  });
  scoresByLawyerId.set(task.assignedLawyerId, entries);
}

function averageNumberScores(scores: number[]): number | null {
  const validScores = scores.filter((score) => Number.isFinite(score) && score >= 1 && score <= 10);

  if (!validScores.length) {
    return null;
  }

  return roundToOne(validScores.reduce((sum, score) => sum + score, 0) / validScores.length);
}

function summarizeAverageStat(
  stats: LawyerPerformanceStat[],
  averageKey: "caseResultAverageScore" | "rollingAverageScore" | "sourceReviewAverageScore",
  countKey: "caseResultCount" | "rollingTaskCount" | "sourceReviewCount",
): number | null {
  const summary = stats.reduce(
    (result, stat) => {
      const score = stat[averageKey];
      const count = stat[countKey];

      if (score === null || count === 0) {
        return result;
      }

      return {
        count: result.count + count,
        total: result.total + score * count,
      };
    },
    { count: 0, total: 0 },
  );

  return summary.count ? roundToOne(summary.total / summary.count) : null;
}

function scoreTime(task: Task, feedback?: CustomerFeedback): number {
  return Math.max(
    parseTime(feedback?.confirmedAt),
    parseTime(task.customerConfirmedAt),
    parseTime(task.sourceReviewedAt),
    parseTime(task.approvedAt),
    parseTime(task.reviewedAt),
    parseTime(task.dueAt),
  );
}

function parseTime(value?: string): number {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value.replace(" ", "T"));

  return Number.isFinite(parsed) ? parsed : 0;
}

function roundToOne(value: number): number {
  return Math.round(value * 10) / 10;
}
