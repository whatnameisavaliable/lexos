import type { Settlement, Task, TaskDeliverable } from "../../types/demo.ts";
import type { TaskStatus } from "../domain/core.ts";

export type TaskMilestoneState = "done" | "current" | "pending" | "cancelled";

export type TaskMilestone = {
  detail: string;
  key: string;
  label: string;
  state: TaskMilestoneState;
  value: string;
};

export type TaskProgressSummary = {
  completedCount: number;
  nextMilestone?: TaskMilestone;
  totalCount: number;
};

const taskStatusOrder: TaskStatus[] = [
  "open",
  "claimed",
  "submitted",
  "approved",
  "customer_confirmed",
  "settlement_pending",
  "settled",
];

export function buildTaskMilestones(task: Task, settlement?: Settlement): TaskMilestone[] {
  if (task.status === "cancelled") {
    return [
      milestone("published", "发布任务", "已发布", task.dueAt, "done"),
      milestone("cancelled", "任务取消", "已取消", "任务已终止，不再进入后续交付与结算流程", "cancelled"),
    ];
  }

  return [
    milestone("published", "发布任务", "已发布", task.dueAt, "done"),
    milestone(
      "claimed",
      "办案接单",
      task.assignedLawyerId ? "已接单" : "待接单",
      task.assignedLawyerId ? "办案律师已进入任务" : "等待符合职级的律师抢单",
      stateFor(task, "claimed"),
    ),
    milestone(
      "submitted",
      "成果提交",
      hasDelivery(task) ? "已提交" : "待提交",
      task.submittedTitle ?? "等待办案律师提交成果",
      stateFor(task, "submitted"),
    ),
    milestone(
      "approved",
      "审核与案源验收",
      approvalMilestoneValue(task),
      approvalMilestoneDetail(task),
      stateFor(task, "approved"),
    ),
    milestone(
      "customer_confirmed",
      "客户确认",
      isTaskAtLeast(task.status, "customer_confirmed") ? "已确认" : "待确认",
      task.customerConfirmedAt ?? "等待客户确认接收",
      stateFor(task, "customer_confirmed"),
    ),
    milestone(
      "settlement",
      "结算记录",
      settlement ? (settlement.status === "confirmed" ? "已确认" : "待财务确认") : "待生成",
      settlement ? "已生成结算记录" : "客户确认后自动生成",
      settlementState(task, settlement),
    ),
  ];
}

export function summarizeTaskMilestones(milestones: TaskMilestone[]): TaskProgressSummary {
  const completedCount = milestones.filter((item) => item.state === "done").length;

  return {
    completedCount,
    nextMilestone: milestones.find((item) => item.state === "current" || item.state === "pending"),
    totalCount: milestones.length,
  };
}

export function buildTaskDeliveryRecords(task: Task): TaskDeliverable[] {
  if (task.deliverables?.length) {
    return task.deliverables;
  }

  if (!task.submittedContent) {
    return [];
  }

  return [
    {
      id: `${task.id}-latest-deliverable`,
      content: task.submittedContent,
      externalUrl: task.externalUrl,
      submittedAt: task.approvedAt ?? task.customerConfirmedAt,
      title: task.submittedTitle ?? "交付成果",
    },
  ];
}

function milestone(key: string, label: string, value: string, detail: string, state: TaskMilestoneState): TaskMilestone {
  return {
    detail,
    key,
    label,
    state,
    value,
  };
}

function hasDelivery(task: Task): boolean {
  return Boolean(task.submittedContent || task.deliverables?.length);
}

function approvalMilestoneValue(task: Task): string {
  if (isTaskAtLeast(task.status, "approved")) {
    return "已验收";
  }

  if (!task.reviewRequired) {
    return "待验收";
  }

  if (task.reviewStatus === "changes_requested") {
    return "退回修改";
  }

  if (task.reviewStatus === "approved") {
    return "待案源验收";
  }

  return "待审核";
}

function approvalMilestoneDetail(task: Task): string {
  if (task.approvedAt) {
    return task.approvedAt;
  }

  if (!task.reviewRequired) {
    return "等待案源律师验收";
  }

  if (task.reviewStatus === "changes_requested") {
    return task.reviewComment ?? "审核退回，等待办案律师修改后重新提交";
  }

  if (task.reviewStatus === "approved") {
    return task.reviewedAt ?? "审核已通过，等待案源律师验收";
  }

  return "等待主任或管理员完成复核";
}

function stateFor(task: Task, target: TaskStatus): TaskMilestoneState {
  if (isTaskAtLeast(task.status, target)) {
    return "done";
  }

  return nextExpectedStatus(task.status) === target ? "current" : "pending";
}

function settlementState(task: Task, settlement?: Settlement): TaskMilestoneState {
  if (settlement?.status === "confirmed" || task.status === "settled") {
    return "done";
  }

  if (settlement || task.status === "settlement_pending") {
    return "current";
  }

  return "pending";
}

function nextExpectedStatus(status: TaskStatus): TaskStatus | undefined {
  if (status === "open") {
    return "claimed";
  }

  if (status === "claimed") {
    return "submitted";
  }

  if (status === "submitted") {
    return "approved";
  }

  if (status === "approved") {
    return "customer_confirmed";
  }

  if (status === "customer_confirmed" || status === "settlement_pending") {
    return "settled";
  }

  return undefined;
}

function isTaskAtLeast(status: TaskStatus, target: TaskStatus): boolean {
  return taskStatusOrder.indexOf(status) >= taskStatusOrder.indexOf(target);
}
