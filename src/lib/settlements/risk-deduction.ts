import { ApiError } from "../api/errors.ts";

export type SettlementRiskPenaltyDestination = "risk_reserve" | "quality_fund" | "client_refund" | "firm_retained";

export type SettlementRiskDeductionLockInput = {
  destination?: unknown;
  note?: unknown;
  riskCaseId?: unknown;
};

export type NormalizedSettlementRiskDeductionLockInput = {
  destination: SettlementRiskPenaltyDestination;
  note: string;
  riskCaseId?: string;
};

export type SettlementRiskDeductionCalculation = {
  deductionAmountCents: number;
  payableAmountCents: number;
};

export const settlementRiskPenaltyDestinationLabels: Record<SettlementRiskPenaltyDestination, string> = {
  client_refund: "客户退费",
  firm_retained: "律所留存",
  quality_fund: "质量督导基金",
  risk_reserve: "公共风险储备金",
};

export const settlementRiskPenaltyDestinations: SettlementRiskPenaltyDestination[] = [
  "risk_reserve",
  "quality_fund",
  "client_refund",
  "firm_retained",
];

const destinationSet = new Set<SettlementRiskPenaltyDestination>(settlementRiskPenaltyDestinations);

export function normalizeSettlementRiskDeductionLockInput(
  input: SettlementRiskDeductionLockInput,
): NormalizedSettlementRiskDeductionLockInput {
  return {
    destination: normalizeDestination(input.destination),
    note: normalizeNote(input.note),
    riskCaseId: normalizeOptionalText(input.riskCaseId),
  };
}

export function calculateSettlementRiskDeduction(
  settlementAmountCents: number,
  deductionBasisPoints: number,
): SettlementRiskDeductionCalculation {
  const amountCents = normalizeMoneyCents(settlementAmountCents);
  const basisPoints = normalizeBasisPoints(deductionBasisPoints);
  const deductionAmountCents = Math.floor((amountCents * basisPoints) / 10000);

  return {
    deductionAmountCents,
    payableAmountCents: Math.max(0, amountCents - deductionAmountCents),
  };
}

export function effectiveSettlementAmountCents(settlement: {
  payableAmountCents?: number | null;
  settlementAmountCents: number;
}): number {
  return normalizeMoneyCents(settlement.payableAmountCents ?? settlement.settlementAmountCents);
}

export function canLockSettlementRiskDeduction(input: {
  deductionBasisPoints?: number | null;
  existingLockedAt?: string | null;
  riskCaseDecision?: string | null;
  riskCaseStatus?: string | null;
  settlementStatus: string;
}): { allowed: boolean; reason?: string } {
  if (input.settlementStatus !== "pending") {
    return { allowed: false, reason: "只有待确认结算可以锁定扣罚资金流向" };
  }

  if (input.existingLockedAt) {
    return { allowed: false, reason: "该结算已锁定扣罚资金流向" };
  }

  if (input.riskCaseStatus === "resolved") {
    return { allowed: false, reason: "已办结风控工单不能重复锁定扣罚" };
  }

  if (input.riskCaseDecision !== "deduction") {
    return { allowed: false, reason: "只有委员会扣减裁决可以锁定扣罚资金流向" };
  }

  if (!Number.isInteger(input.deductionBasisPoints) || Number(input.deductionBasisPoints) <= 0) {
    return { allowed: false, reason: "扣减裁决缺少有效扣减比例" };
  }

  return { allowed: true };
}

export function riskPenaltyDestinationLabel(destination?: string | null): string {
  if (destination && destinationSet.has(destination as SettlementRiskPenaltyDestination)) {
    return settlementRiskPenaltyDestinationLabels[destination as SettlementRiskPenaltyDestination];
  }

  return "未锁定";
}

export function throwIfCannotLockSettlementRiskDeduction(input: Parameters<typeof canLockSettlementRiskDeduction>[0]) {
  const permission = canLockSettlementRiskDeduction(input);

  if (!permission.allowed) {
    throw new ApiError(409, "CONFLICT", permission.reason ?? "当前结算不能锁定扣罚资金流向");
  }
}

function normalizeDestination(value: unknown): SettlementRiskPenaltyDestination {
  if (typeof value === "string" && destinationSet.has(value as SettlementRiskPenaltyDestination)) {
    return value as SettlementRiskPenaltyDestination;
  }

  return "risk_reserve";
}

function normalizeNote(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, 1200);
}

function normalizeOptionalText(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const text = value.trim();

  return text || undefined;
}

function normalizeBasisPoints(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(10000, Math.max(0, Math.trunc(value)));
}

function normalizeMoneyCents(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}
