import type { TaskStatus, UserRole } from "../domain/core.ts";
import { formatMoney } from "../format.ts";
import { averageScores } from "../reviews/source-review.ts";
import { effectiveSettlementAmountCents } from "../settlements/risk-deduction.ts";
import type { CustomerFeedback, DemoUser, Settlement, Task } from "../../types/demo.ts";

export type PersonalWorkbenchMetric = {
  label: string;
  value: string;
};

export type PersonalWorkbenchAction = {
  detail: string;
  id: string;
  status?: TaskStatus;
  title: string;
};

export type PersonalWorkbenchSummary = {
  actions: PersonalWorkbenchAction[];
  metrics: PersonalWorkbenchMetric[];
  subtitle: string;
  title: string;
};

export function buildPersonalWorkbench(input: {
  currentUser: DemoUser;
  feedback: CustomerFeedback[];
  settlements: Settlement[];
  tasks: Task[];
}): PersonalWorkbenchSummary {
  const scopedTasks = tasksForRole(input.tasks, input.currentUser);
  const scopedTaskIds = new Set(scopedTasks.map((task) => task.id));
  const scopedFeedback = input.feedback.filter((item) => scopedTaskIds.has(item.taskId));
  const scopedSettlements = settlementsForRole(input.settlements, input.currentUser, scopedTaskIds);
  const pendingSettlements = scopedSettlements.filter((item) => item.status === "pending");
  const confirmedSettlements = scopedSettlements.filter((item) => item.status === "confirmed");
  const activeTasks = scopedTasks.filter((task) => !["settled", "cancelled"].includes(task.status));
  const scoreAverage = averagePerformanceScore(scopedFeedback, scopedTasks);

  return {
    actions: buildActions(input.currentUser.role, scopedTasks, pendingSettlements),
    metrics: [
      { label: metricTaskLabel(input.currentUser.role), value: `${scopedTasks.length}` },
      { label: "待处理", value: `${countPendingWork(input.currentUser.role, scopedTasks, pendingSettlements)}` },
      { label: "任务金额", value: formatMoney(scopedTasks.reduce((sum, task) => sum + task.amountCents, 0)) },
      {
        label: "已确认结算",
        value: formatMoney(confirmedSettlements.reduce((sum, item) => sum + effectiveSettlementAmountCents(item), 0)),
      },
      { label: "综合评分", value: scoreAverage === null ? "待采集" : `${scoreAverage}/10` },
    ],
    subtitle: subtitleForRole(input.currentUser.role, activeTasks.length, pendingSettlements.length),
    title: `${input.currentUser.displayName}的个人工作台`,
  };
}

function tasksForRole(tasks: Task[], user: DemoUser): Task[] {
  if (user.role === "handling_lawyer") {
    return tasks.filter((task) => task.assignedLawyerId === user.id);
  }

  if (user.role === "source_lawyer") {
    return tasks.filter((task) => task.sourceLawyerId === user.id);
  }

  return tasks;
}

function settlementsForRole(settlements: Settlement[], user: DemoUser, taskIds: Set<string>): Settlement[] {
  if (user.role === "handling_lawyer") {
    return settlements.filter((item) => item.lawyerId === user.id);
  }

  if (user.role === "source_lawyer") {
    return settlements.filter((item) => taskIds.has(item.taskId));
  }

  return settlements;
}

function buildActions(role: UserRole, tasks: Task[], pendingSettlements: Settlement[]): PersonalWorkbenchAction[] {
  const taskActions = tasks
    .map((task) => actionForTask(role, task))
    .filter((item): item is PersonalWorkbenchAction => Boolean(item));

  const settlementActions =
    role === "finance" || role === "system_admin" || role === "firm_admin"
      ? pendingSettlements.slice(0, 3).map((settlement) => ({
          detail: `${settlement.taskTitle ?? "任务"} · ${formatMoney(effectiveSettlementAmountCents(settlement))}`,
          id: `settlement-${settlement.id}`,
          title: "确认待结算",
        }))
      : [];

  return [...taskActions, ...settlementActions].slice(0, 5);
}

function actionForTask(role: UserRole, task: Task): PersonalWorkbenchAction | null {
  if (role === "handling_lawyer") {
    if (task.status === "claimed") {
      return { detail: `${task.taskType} · ${formatMoney(task.amountCents)}`, id: task.id, status: task.status, title: `提交成果：${task.title}` };
    }

    if (task.status === "submitted") {
      return { detail: "等待案源律师验收", id: task.id, status: task.status, title: task.title };
    }

    if (task.status === "approved") {
      return { detail: "等待客户确认接收", id: task.id, status: task.status, title: task.title };
    }
  }

  if (role === "source_lawyer") {
    if (task.status === "submitted") {
      return { detail: "办案律师已提交，等待验收", id: task.id, status: task.status, title: `验收任务：${task.title}` };
    }

    if (task.status === "open") {
      return { detail: "任务大厅待抢单", id: task.id, status: task.status, title: task.title };
    }
  }

  if (task.status === "submitted") {
    return { detail: "待案源律师验收", id: task.id, status: task.status, title: task.title };
  }

  return null;
}

function countPendingWork(role: UserRole, tasks: Task[], pendingSettlements: Settlement[]): number {
  if (role === "handling_lawyer") {
    return tasks.filter((task) => task.status === "claimed").length;
  }

  if (role === "source_lawyer") {
    return tasks.filter((task) => task.status === "submitted").length;
  }

  if (role === "finance") {
    return pendingSettlements.length;
  }

  return tasks.filter((task) => task.status === "submitted").length + pendingSettlements.length;
}

function averagePerformanceScore(feedback: CustomerFeedback[], tasks: Task[]): number | null {
  return averageScores([
    ...feedback.map((item) => item.score),
    ...tasks.map((task) => task.sourceReviewScore),
    ...tasks.map((task) => task.caseResultScore),
  ]);
}

function metricTaskLabel(role: UserRole): string {
  if (role === "handling_lawyer") {
    return "我的任务";
  }

  if (role === "source_lawyer") {
    return "我发布的任务";
  }

  return "可见任务";
}

function subtitleForRole(role: UserRole, activeTaskCount: number, pendingSettlementCount: number): string {
  if (role === "handling_lawyer") {
    return `当前 ${activeTaskCount} 个在办/待确认任务，优先处理已接单但未提交的事项。`;
  }

  if (role === "source_lawyer") {
    return `当前 ${activeTaskCount} 个案源任务在流转，重点关注待验收成果。`;
  }

  if (role === "finance") {
    return `当前 ${pendingSettlementCount} 条待确认结算，优先处理已过锁定期记录。`;
  }

  return `当前 ${activeTaskCount} 个活跃任务，适合快速扫描待验收与待结算压力。`;
}
