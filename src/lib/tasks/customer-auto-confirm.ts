import type { TaskStatus } from "../domain/core.ts";

const DAY_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_CUSTOMER_AUTO_CONFIRM_DAYS = 7;

export type CustomerAutoConfirmTask = {
  approvedAt?: string | null;
  assignedLawyerId?: string | null;
  customerConfirmedAt?: string | null;
  status: TaskStatus | string;
};

export type CustomerAutoConfirmStatus = {
  due: boolean;
  dueAt: Date | null;
  reason:
    | "already_confirmed"
    | "disabled"
    | "invalid_approved_at"
    | "missing_approved_at"
    | "missing_lawyer"
    | "not_approved"
    | "not_due"
    | "ready";
};

export function customerAutoConfirmDueAt(approvedAt: string | null | undefined, autoConfirmDays: number): Date | null {
  if (!approvedAt || autoConfirmDays <= 0) {
    return null;
  }

  const approvedDate = new Date(approvedAt);

  if (Number.isNaN(approvedDate.getTime())) {
    return null;
  }

  return new Date(approvedDate.getTime() + autoConfirmDays * DAY_MS);
}

export function buildCustomerAutoConfirmStatus(
  task: CustomerAutoConfirmTask,
  autoConfirmDays: number,
  now = new Date(),
): CustomerAutoConfirmStatus {
  if (autoConfirmDays <= 0) {
    return { due: false, dueAt: null, reason: "disabled" };
  }

  if (task.status !== "approved") {
    return { due: false, dueAt: null, reason: "not_approved" };
  }

  if (!task.assignedLawyerId) {
    return { due: false, dueAt: null, reason: "missing_lawyer" };
  }

  if (task.customerConfirmedAt) {
    return { due: false, dueAt: null, reason: "already_confirmed" };
  }

  if (!task.approvedAt) {
    return { due: false, dueAt: null, reason: "missing_approved_at" };
  }

  const dueAt = customerAutoConfirmDueAt(task.approvedAt, autoConfirmDays);

  if (!dueAt) {
    return { due: false, dueAt: null, reason: "invalid_approved_at" };
  }

  return {
    due: dueAt.getTime() <= now.getTime(),
    dueAt,
    reason: dueAt.getTime() <= now.getTime() ? "ready" : "not_due",
  };
}

export function isCustomerAutoConfirmDue(
  task: CustomerAutoConfirmTask,
  autoConfirmDays: number,
  now = new Date(),
): boolean {
  return buildCustomerAutoConfirmStatus(task, autoConfirmDays, now).due;
}
