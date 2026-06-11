import type { Customer, CustomerFeedback, Settlement, Task } from "../../types/demo.ts";
import { effectiveSettlementAmountCents } from "../settlements/risk-deduction.ts";

export type CustomerChannelStat = {
  activeTaskCount: number;
  averageScore: number | null;
  confirmedTaskCount: number;
  confirmedTaskRate: number;
  customerCount: number;
  feedbackCount: number;
  settlementAmountCents: number;
  source: string;
  taskAmountCents: number;
  taskCount: number;
};

type BuildCustomerChannelStatsInput = {
  customers: Customer[];
  feedback: CustomerFeedback[];
  settlements: Settlement[];
  tasks: Task[];
};

const closedTaskStatuses = new Set(["customer_confirmed", "settlement_pending", "settled"]);

export function buildCustomerChannelStats({
  customers,
  feedback,
  settlements,
  tasks,
}: BuildCustomerChannelStatsInput): CustomerChannelStat[] {
  const customersById = new Map(customers.map((customer) => [customer.id, customer]));
  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  const statsBySource = new Map<string, CustomerChannelStat>();

  customers.forEach((customer) => {
    getOrCreateStat(statsBySource, normalizeSource(customer.source)).customerCount += 1;
  });

  tasks.forEach((task) => {
    const source = normalizeSource(customersById.get(task.customerId)?.source);
    const stat = getOrCreateStat(statsBySource, source);

    stat.taskCount += 1;

    if (task.status !== "cancelled") {
      stat.activeTaskCount += 1;
      stat.taskAmountCents += task.amountCents;
    }

    if (closedTaskStatuses.has(task.status)) {
      stat.confirmedTaskCount += 1;
    }
  });

  settlements.forEach((settlement) => {
    const task = tasksById.get(settlement.taskId);
    const source = normalizeSource(task ? customersById.get(task.customerId)?.source : undefined);

    getOrCreateStat(statsBySource, source).settlementAmountCents += effectiveSettlementAmountCents(settlement);
  });

  const scoresBySource = new Map<string, number[]>();

  feedback.forEach((item) => {
    const task = tasksById.get(item.taskId);
    const source = normalizeSource(task ? customersById.get(task.customerId)?.source : undefined);
    const scores = scoresBySource.get(source) ?? [];

    scores.push(item.score);
    scoresBySource.set(source, scores);
  });

  scoresBySource.forEach((scores, source) => {
    const stat = getOrCreateStat(statsBySource, source);

    stat.feedbackCount = scores.length;
    stat.averageScore = scores.length ? roundToOne(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;
  });

  return Array.from(statsBySource.values())
    .map((stat) => ({
      ...stat,
      confirmedTaskRate: stat.activeTaskCount ? roundToOne((stat.confirmedTaskCount / stat.activeTaskCount) * 100) : 0,
    }))
    .sort((first, second) => {
      if (second.taskAmountCents !== first.taskAmountCents) {
        return second.taskAmountCents - first.taskAmountCents;
      }

      if (second.customerCount !== first.customerCount) {
        return second.customerCount - first.customerCount;
      }

      return first.source.localeCompare(second.source, "zh-CN");
    });
}

export function summarizeCustomerChannelStats(stats: CustomerChannelStat[]) {
  return {
    activeTaskCount: stats.reduce((sum, item) => sum + item.activeTaskCount, 0),
    channelCount: stats.length,
    confirmedTaskCount: stats.reduce((sum, item) => sum + item.confirmedTaskCount, 0),
    customerCount: stats.reduce((sum, item) => sum + item.customerCount, 0),
    settlementAmountCents: stats.reduce((sum, item) => sum + item.settlementAmountCents, 0),
    taskAmountCents: stats.reduce((sum, item) => sum + item.taskAmountCents, 0),
    topChannel: stats[0],
  };
}

function getOrCreateStat(statsBySource: Map<string, CustomerChannelStat>, source: string): CustomerChannelStat {
  const existing = statsBySource.get(source);

  if (existing) {
    return existing;
  }

  const stat: CustomerChannelStat = {
    activeTaskCount: 0,
    averageScore: null,
    confirmedTaskCount: 0,
    confirmedTaskRate: 0,
    customerCount: 0,
    feedbackCount: 0,
    settlementAmountCents: 0,
    source,
    taskAmountCents: 0,
    taskCount: 0,
  };

  statsBySource.set(source, stat);

  return stat;
}

function normalizeSource(source: string | undefined): string {
  return source?.trim() || "未记录来源";
}

function roundToOne(value: number): number {
  return Math.round(value * 10) / 10;
}
