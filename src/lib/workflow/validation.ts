import { createHash, randomBytes } from "node:crypto";

import { calculateSettlementAmount } from "../domain/core.ts";

export type CreateCustomerValidatedInput = {
  name: string;
  contactName?: string;
  phone?: string;
  source?: string;
};

export type CreateTaskValidatedInput = {
  customerId: string;
  title: string;
  description?: string;
  taskType: string;
  amountCents: number;
  minRankId?: string;
  dueAt?: string;
  reviewLawyerId?: string;
  reviewRequired: boolean;
};

export type SettlementDraft = {
  taskId: string;
  lawyerId: string;
  rankId: string;
  taskAmountCents: number;
  settlementBasisPoints: number;
  settlementAmountCents: number;
  status: "pending";
};

export function validateCreateCustomerInput(input: {
  name: unknown;
  contactName?: unknown;
  phone?: unknown;
  source?: unknown;
}): CreateCustomerValidatedInput {
  const name = requiredString(input.name, "客户名称");

  return {
    name,
    contactName: optionalString(input.contactName),
    phone: optionalString(input.phone),
    source: optionalString(input.source),
  };
}

export function validateCreateTaskInput(input: {
  customerId: unknown;
  title: unknown;
  description?: unknown;
  taskType?: unknown;
  amountYuan?: unknown;
  amountCents?: unknown;
  minRankId?: unknown;
  dueAt?: unknown;
  reviewLawyerId?: unknown;
  reviewRequired?: unknown;
}): CreateTaskValidatedInput {
  const amountCents =
    input.amountCents !== undefined ? parseAmountCents(input.amountCents) : parseAmountYuan(input.amountYuan);

  if (amountCents <= 0) {
    throw new Error("任务金额必须大于 0");
  }

  return {
    customerId: requiredString(input.customerId, "客户"),
    title: requiredString(input.title, "任务标题"),
    description: optionalString(input.description),
    taskType: optionalString(input.taskType) ?? "诉讼任务",
    amountCents,
    minRankId: optionalString(input.minRankId),
    dueAt: optionalString(input.dueAt),
    reviewLawyerId: optionalString(input.reviewLawyerId),
    reviewRequired: parseBoolean(input.reviewRequired),
  };
}

export function buildPortalToken(prefix = "LEXOS"): string {
  return `${prefix}-${randomBytes(18).toString("base64url")}`;
}

export function buildPortalTokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function validateSettlementDraft(input: {
  taskId: string;
  lawyerId: string;
  rankId: string;
  taskAmountCents: number;
  settlementBasisPoints: number;
}): SettlementDraft {
  const taskAmountCents = parseAmountCents(input.taskAmountCents);
  const settlementAmountCents = calculateSettlementAmount(taskAmountCents, input.settlementBasisPoints);

  return {
    taskId: requiredString(input.taskId, "任务"),
    lawyerId: requiredString(input.lawyerId, "律师"),
    rankId: requiredString(input.rankId, "职级"),
    taskAmountCents,
    settlementBasisPoints: input.settlementBasisPoints,
    settlementAmountCents,
    status: "pending",
  };
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label}不能为空`);
  }

  return value.trim();
}

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error("字段必须是字符串");
  }

  return value.trim() || undefined;
}

function parseBoolean(value: unknown): boolean {
  return value === true || value === "true";
}

function parseAmountYuan(value: unknown): number {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new Error("任务金额不能为空");
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    throw new Error("任务金额格式不正确");
  }

  return Math.round(amount * 100);
}

function parseAmountCents(value: unknown): number {
  const amount = Number(value);

  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error("金额分值必须是非负整数");
  }

  return amount;
}
