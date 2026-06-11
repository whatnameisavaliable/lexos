import { isDirectorRole, isLawyerRole, type TaskStatus, type UserRole } from "../domain/core.ts";
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
  const scopedSettlements = settlementsForRole(input.settlements, input.currentUser);
  const pendingSettlements = scopedSettlements.filter((item) => item.status === "pending");
  const confirmedSettlements = scopedSettlements.filter((item) => item.status === "confirmed");
  const activeTasks = scopedTasks.filter((task) => !["settled", "cancelled"].includes(task.status));
  const scoreAverage = averagePerformanceScore(scopedFeedback, scopedTasks);

  return {
    actions: buildActions(input.currentUser, scopedTasks, pendingSettlements),
    metrics: [
      { label: metricTaskLabel(input.currentUser.role), value: `${scopedTasks.length}` },
      { label: "待处理", value: `${countPendingWork(input.currentUser, scopedTasks, pendingSettlements)}` },
      { label: "任务金额", value: formatMoney(scopedTasks.reduce((sum, task) => sum + task.amountCents, 0)) },
      {
        label: "已确认结算",
        value: formatMoney(confirmedSettlements.reduce((sum, item) => sum + effectiveSettlementAmountCents(item), 0)),
      },
      { label: "综合评分", value: scoreAverage === null ? "待采集" : `${scoreAverage}/10` },
    ],
    subtitle: subtitleForRole(input.currentUser.role, activeTasks.length, pendingSettlements.length),
    title: isDirectorRole(input.currentUser.role) ? "全所经营工作台" : `${input.currentUser.displayName}的工作台`,
  };
}

function tasksForRole(tasks: Task[], user: DemoUser): Task[] {
  if (isLawyerRole(user.role)) {
    return tasks.filter((task) => task.assignedLawyerId === user.id || task.sourceLawyerId === user.id);
  }

  return tasks;
}

function settlementsForRole(settlements: Settlement[], user: DemoUser): Settlement[] {
  if (isLawyerRole(user.role)) {
    return settlements.filter((item) => item.lawyerId === user.id);
  }

  return settlements;
}

function buildActions(user: DemoUser, tasks: Task[], pendingSettlements: Settlement[]): PersonalWorkbenchAction[] {
  const taskActions = tasks
    .map((task) => actionForTask(user, task))
    .filter((item): item is PersonalWorkbenchAction => Boolean(item));

  const settlementActions =
    user.role === "finance"
      ? pendingSettlements.slice(0, 3).map((settlement) => ({
          detail: `${settlement.taskTitle ?? "任务"} · ${formatMoney(effectiveSettlementAmountCents(settlement))}`,
          id: `settlement-${settlement.id}`,
          title: "确认待结算",
        }))
      : [];

  return [...taskActions, ...settlementActions].slice(0, 5);
}

function actionForTask(user: DemoUser, task: Task): PersonalWorkbenchAction | null {
  const isAssigned = task.assignedLawyerId === user.id;
  const isSourced = task.sourceLawyerId === user.id;

  if (isLawyerRole(user.role)) {
    if (isAssigned && task.status === "claimed") {
      return { detail: `${task.taskType} · ${formatMoney(task.amountCents)}`, id: task.id, status: task.status, title: `提交成果：${task.title}` };
    }

    if (isSourced && task.status === "submitted") {
      return { detail: "承办律师已提交，等待发起人验收", id: task.id, status: task.status, title: `验收任务：${task.title}` };
    }

    if (isAssigned && task.status === "submitted") {
      return { detail: "等待发起人验收", id: task.id, status: task.status, title: task.title };
    }

    if (isSourced && task.status === "open") {
      return { detail: "任务大厅待承接", id: task.id, status: task.status, title: task.title };
    }
  }

  if (isDirectorRole(user.role) && task.reviewRequired && task.reviewStatus === "pending") {
    return { detail: "待主任复核", id: task.id, status: task.status, title: task.title };
  }

  if (task.status === "submitted") {
    return { detail: "待发起人验收", id: task.id, status: task.status, title: task.title };
  }

  return null;
}

function countPendingWork(user: DemoUser, tasks: Task[], pendingSettlements: Settlement[]): number {
  if (isLawyerRole(user.role)) {
    return tasks.filter(
      (task) =>
        (task.assignedLawyerId === user.id && task.status === "claimed") ||
        (task.sourceLawyerId === user.id && task.status === "submitted"),
    ).length;
  }

  if (user.role === "finance") {
    return pendingSettlements.length;
  }

  return tasks.filter((task) => task.status === "submitted" || (task.reviewRequired && task.reviewStatus === "pending")).length;
}

function averagePerformanceScore(feedback: CustomerFeedback[], tasks: Task[]): number | null {
  return averageScores([
    ...feedback.map((item) => item.score),
    ...tasks.map((task) => task.sourceReviewScore),
    ...tasks.map((task) => task.caseResultScore),
  ]);
}

function metricTaskLabel(role: UserRole): string {
  if (isLawyerRole(role)) {
    return "我的任务";
  }

  if (isDirectorRole(role)) {
    return "全所任务";
  }

  return "可见任务";
}

function subtitleForRole(role: UserRole, activeTaskCount: number, pendingSettlementCount: number): string {
  if (isLawyerRole(role)) {
    return `当前 ${activeTaskCount} 个本人相关任务在流转，优先处理待提交、待验收和风控答辩。`;
  }

  if (role === "finance") {
    return `当前 ${pendingSettlementCount} 条待确认结算，优先处理已过锁定期记录。`;
  }

  if (isDirectorRole(role)) {
    return `当前 ${activeTaskCount} 个全所活跃任务，重点关注复核、风险和结算压力。`;
  }

  return "系统配置角色不参与业务工作台。";
}
