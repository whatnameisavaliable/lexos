import type { SupabaseClient } from "@supabase/supabase-js";

import { ApiError } from "../api/errors.ts";
import type { AuditLogInput } from "../audit/log.ts";
import { writeAuditLog } from "../audit/log.ts";
import type { InternalSession } from "../auth/session.ts";
import {
  calculateSettlementRiskDeduction,
  normalizeSettlementRiskDeductionLockInput,
  riskPenaltyDestinationLabel,
  throwIfCannotLockSettlementRiskDeduction,
  type NormalizedSettlementRiskDeductionLockInput,
  type SettlementRiskDeductionLockInput,
} from "./risk-deduction.ts";

type SettlementRiskDeductionRecord = {
  id: string;
  organization_id: string;
  payable_amount_cents?: number | null;
  risk_deduction_locked_at?: string | null;
  settlement_amount_cents: number;
  status: string;
  task_id: string;
};

type RiskDeductionCaseRecord = {
  committee_decision: string | null;
  committee_deduction_basis_points: number | null;
  id: string;
  status: string;
  task_id: string | null;
  title: string;
};

export type LockSettlementRiskDeductionResult = {
  settlement: {
    id: string;
    payable_amount_cents: number | null;
    risk_deduction_amount_cents: number | null;
    risk_deduction_basis_points: number | null;
    risk_deduction_case_id: string | null;
    risk_deduction_locked_at: string | null;
    risk_penalty_destination: string | null;
    status: string;
  };
};

export async function lockSettlementRiskDeduction(
  admin: SupabaseClient,
  session: InternalSession,
  settlementId: string,
  rawInput: SettlementRiskDeductionLockInput,
  auditContext: Pick<AuditLogInput, "ipAddress" | "userAgent"> = {},
): Promise<LockSettlementRiskDeductionResult> {
  const input = normalizeSettlementRiskDeductionLockInput(rawInput);
  const settlement = await loadSettlement(admin, session.organizationId, settlementId);
  const riskCase = await loadRiskDeductionCase(admin, session.organizationId, settlement.task_id, input);

  if (riskCase.task_id !== settlement.task_id) {
    throw new ApiError(409, "CONFLICT", "风控工单与结算任务不匹配");
  }

  throwIfCannotLockSettlementRiskDeduction({
    deductionBasisPoints: riskCase.committee_deduction_basis_points,
    existingLockedAt: settlement.risk_deduction_locked_at,
    riskCaseDecision: riskCase.committee_decision,
    riskCaseStatus: riskCase.status,
    settlementStatus: settlement.status,
  });

  const deductionBasisPoints = Number(riskCase.committee_deduction_basis_points);
  const { deductionAmountCents, payableAmountCents } = calculateSettlementRiskDeduction(
    Number(settlement.settlement_amount_cents),
    deductionBasisPoints,
  );
  const lockedAt = new Date().toISOString();
  const resolutionNote = buildRiskCaseResolutionNote({
    deductionAmountCents,
    destination: input.destination,
    note: input.note,
    payableAmountCents,
  });

  const { data: updatedSettlement, error: updateSettlementError } = await admin
    .from("settlements")
    .update({
      payable_amount_cents: payableAmountCents,
      risk_deduction_amount_cents: deductionAmountCents,
      risk_deduction_basis_points: deductionBasisPoints,
      risk_deduction_case_id: riskCase.id,
      risk_deduction_locked_at: lockedAt,
      risk_deduction_locked_by: session.userId,
      risk_deduction_note: input.note || null,
      risk_penalty_destination: input.destination,
      updated_at: lockedAt,
    })
    .eq("id", settlement.id)
    .eq("organization_id", session.organizationId)
    .eq("status", "pending")
    .is("risk_deduction_locked_at", null)
    .select(
      "id, status, payable_amount_cents, risk_deduction_case_id, risk_deduction_basis_points, risk_deduction_amount_cents, risk_penalty_destination, risk_deduction_locked_at",
    )
    .single();

  if (updateSettlementError) {
    throw updateSettlementError;
  }

  const { error: updateRiskCaseError } = await admin
    .from("risk_cases")
    .update({
      owner_user_id: session.userId,
      resolution_note: resolutionNote,
      resolved_at: lockedAt,
      status: "resolved",
      updated_at: lockedAt,
    })
    .eq("id", riskCase.id)
    .eq("organization_id", session.organizationId)
    .eq("status", riskCase.status);

  if (updateRiskCaseError) {
    throw updateRiskCaseError;
  }

  await writeAuditLog(admin, {
    organizationId: session.organizationId,
    actorUserId: session.userId,
    action: "settlements.lock_risk_deduction",
    entityType: "settlements",
    entityId: settlement.id,
    metadata: {
      deductionAmountCents,
      destination: input.destination,
      payableAmountCents,
      riskCaseId: riskCase.id,
      settlementAmountCents: settlement.settlement_amount_cents,
    },
    ...auditContext,
  });

  return {
    settlement: updatedSettlement as LockSettlementRiskDeductionResult["settlement"],
  };
}

async function loadSettlement(
  admin: SupabaseClient,
  organizationId: string,
  settlementId: string,
): Promise<SettlementRiskDeductionRecord> {
  const { data, error } = await admin
    .from("settlements")
    .select("id, organization_id, task_id, settlement_amount_cents, payable_amount_cents, status, risk_deduction_locked_at")
    .eq("id", settlementId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new ApiError(404, "NOT_FOUND", "结算记录不存在");
  }

  return data as SettlementRiskDeductionRecord;
}

async function loadRiskDeductionCase(
  admin: SupabaseClient,
  organizationId: string,
  taskId: string,
  input: NormalizedSettlementRiskDeductionLockInput,
): Promise<RiskDeductionCaseRecord> {
  let query = admin
    .from("risk_cases")
    .select("id, task_id, title, status, committee_decision, committee_deduction_basis_points")
    .eq("organization_id", organizationId)
    .eq("task_id", taskId)
    .eq("committee_decision", "deduction")
    .neq("status", "resolved")
    .order("committee_decided_at", { ascending: false })
    .limit(1);

  if (input.riskCaseId) {
    query = query.eq("id", input.riskCaseId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const [riskCase] = (data ?? []) as RiskDeductionCaseRecord[];

  if (!riskCase) {
    throw new ApiError(404, "NOT_FOUND", "未找到可锁定的委员会扣减裁决工单");
  }

  return riskCase;
}

function buildRiskCaseResolutionNote(input: {
  deductionAmountCents: number;
  destination: string;
  note: string;
  payableAmountCents: number;
}): string {
  const noteText = input.note ? `；说明：${input.note}` : "";

  return `扣罚资金流向已锁定：扣减 ${formatMoney(input.deductionAmountCents)}，律师实付 ${formatMoney(input.payableAmountCents)}，去向 ${riskPenaltyDestinationLabel(input.destination)}${noteText}`;
}

function formatMoney(amountCents: number): string {
  return `${(Math.trunc(amountCents) / 100).toFixed(2)} 元`;
}
