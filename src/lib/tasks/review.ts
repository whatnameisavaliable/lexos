import type { TaskStatus, UserRole } from "../domain/core.ts";

export type TaskReviewStatus = "not_required" | "pending" | "approved" | "changes_requested";

export type TaskReviewDecision = "approved" | "changes_requested";

export type TaskReviewInput = {
  comment?: unknown;
  decision?: unknown;
};

export type TaskReviewDraft = {
  comment?: string;
  decision: TaskReviewDecision;
};

export const taskReviewerRoles: UserRole[] = ["director"];

export function canReviewTask(input: {
  currentUserId: string;
  reviewLawyerId?: string;
  reviewRequired?: boolean;
  reviewStatus?: TaskReviewStatus;
  taskStatus: TaskStatus;
  userRole: UserRole;
}): boolean {
  if (!taskReviewerRoles.includes(input.userRole)) {
    return false;
  }

  if (!input.reviewRequired || input.taskStatus !== "submitted" || input.reviewStatus !== "pending") {
    return false;
  }

  if (input.reviewLawyerId && input.reviewLawyerId !== input.currentUserId) {
    return false;
  }

  return true;
}

export function isTaskReviewSatisfied(input: { reviewRequired?: boolean; reviewStatus?: TaskReviewStatus }): boolean {
  return !input.reviewRequired || input.reviewStatus === "approved";
}

export function validateTaskReviewInput(input: TaskReviewInput): TaskReviewDraft {
  const decision = input.decision;

  if (decision !== "approved" && decision !== "changes_requested") {
    throw new Error("审核结论必须是通过或退回修改");
  }

  return {
    comment: optionalText(input.comment, 500),
    decision,
  };
}

function optionalText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const text = value.trim();

  if (!text) {
    return undefined;
  }

  return text.slice(0, maxLength);
}
