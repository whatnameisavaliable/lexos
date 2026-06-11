import type { SupabaseClient } from "@supabase/supabase-js";

import type { AuditLogInput } from "../audit/log.ts";
import { writeAuditLog } from "../audit/log.ts";
import type { InternalSession } from "../auth/session.ts";
import { transitionTaskStatus } from "../domain/core.ts";
import { loadSystemSettingNumber } from "../settings/runtime.ts";
import { validateSettlementDraft } from "../workflow/validation.ts";
import { buildCustomerAutoConfirmStatus } from "./customer-auto-confirm.ts";

type AutoConfirmTaskRow = {
  amount_cents: number | null;
  approved_at: string | null;
  assigned_lawyer_id: string | null;
  customer_confirmed_at: string | null;
  id: string;
  status: string;
  title: string | null;
};

type MemberRow = {
  rank_id: string | null;
  ranks?: { settlement_basis_points?: number | null } | Array<{ settlement_basis_points?: number | null }> | null;
  user_id: string;
};

type SettlementInsert = {
  generated_at: string;
  lawyer_id: string;
  organization_id: string;
  payable_amount_cents: number;
  rank_id: string;
  settlement_amount_cents: number;
  settlement_basis_points: number;
  status: "pending";
  task_amount_cents: number;
  task_id: string;
};

export type AutoConfirmOverdueResult = {
  autoConfirmDays: number;
  cutoffAt: string | null;
  processedCount: number;
  settlementIds: string[];
  skippedCount: number;
  taskIds: string[];
};

export async function autoConfirmOverdueTasks(
  admin: SupabaseClient,
  session: Pick<InternalSession, "organizationId" | "userId">,
  auditContext: Pick<AuditLogInput, "ipAddress" | "userAgent"> = {},
): Promise<AutoConfirmOverdueResult> {
  const autoConfirmDays = await loadSystemSettingNumber(admin, session.organizationId, "customer_auto_confirm_days");

  if (autoConfirmDays <= 0) {
    return emptyResult(autoConfirmDays);
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const cutoffAt = new Date(now.getTime() - autoConfirmDays * 24 * 60 * 60 * 1000).toISOString();
  const { data: taskRows, error: taskError } = await admin
    .from("tasks")
    .select("id, title, amount_cents, assigned_lawyer_id, status, approved_at, customer_confirmed_at")
    .eq("organization_id", session.organizationId)
    .eq("status", "approved")
    .lte("approved_at", cutoffAt)
    .is("customer_confirmed_at", null)
    .not("assigned_lawyer_id", "is", null)
    .limit(200);

  if (taskError) {
    throw taskError;
  }

  const tasks = ((taskRows ?? []) as AutoConfirmTaskRow[]).filter((task) =>
    buildCustomerAutoConfirmStatus(
      {
        approvedAt: task.approved_at,
        assignedLawyerId: task.assigned_lawyer_id,
        customerConfirmedAt: task.customer_confirmed_at,
        status: task.status,
      },
      autoConfirmDays,
      now,
    ).due,
  );

  if (!tasks.length) {
    return emptyResult(autoConfirmDays, cutoffAt);
  }

  const taskIds = tasks.map((task) => task.id);
  const { data: existingRows, error: existingError } = await admin
    .from("settlements")
    .select("task_id")
    .eq("organization_id", session.organizationId)
    .in("task_id", taskIds);

  if (existingError) {
    throw existingError;
  }

  const existingSettlementTaskIds = new Set(((existingRows ?? []) as Array<{ task_id: string | null }>).map((row) => row.task_id));
  const candidateTasks = tasks.filter((task) => !existingSettlementTaskIds.has(task.id));
  const lawyerIds = Array.from(new Set(candidateTasks.map((task) => task.assigned_lawyer_id).filter(isString)));

  if (!candidateTasks.length || !lawyerIds.length) {
    return emptyResult(autoConfirmDays, cutoffAt, tasks.length);
  }

  const { data: memberRows, error: memberError } = await admin
    .from("organization_members")
    .select("user_id, rank_id, ranks:rank_id(settlement_basis_points)")
    .eq("organization_id", session.organizationId)
    .eq("role_code", "handling_lawyer")
    .eq("status", "active")
    .in("user_id", lawyerIds);

  if (memberError) {
    throw memberError;
  }

  const membersByUserId = new Map(((memberRows ?? []) as MemberRow[]).map((member) => [member.user_id, member]));
  const inserts: SettlementInsert[] = [];

  candidateTasks.forEach((task) => {
    const lawyerId = task.assigned_lawyer_id;
    const member = lawyerId ? membersByUserId.get(lawyerId) : undefined;
    const rank = relation(member?.ranks);

    if (!lawyerId || !member?.rank_id || !rank) {
      return;
    }

    const settlementDraft = validateSettlementDraft({
      lawyerId,
      rankId: member.rank_id,
      settlementBasisPoints: rank.settlement_basis_points,
      taskAmountCents: Number(task.amount_cents ?? 0),
      taskId: task.id,
    });

    inserts.push({
      generated_at: nowIso,
      lawyer_id: settlementDraft.lawyerId,
      organization_id: session.organizationId,
      payable_amount_cents: settlementDraft.settlementAmountCents,
      rank_id: settlementDraft.rankId,
      settlement_amount_cents: settlementDraft.settlementAmountCents,
      settlement_basis_points: settlementDraft.settlementBasisPoints,
      status: settlementDraft.status,
      task_amount_cents: settlementDraft.taskAmountCents,
      task_id: settlementDraft.taskId,
    });
  });

  if (!inserts.length) {
    return emptyResult(autoConfirmDays, cutoffAt, tasks.length);
  }

  const { data: settlements, error: settlementError } = await admin
    .from("settlements")
    .insert(inserts)
    .select("id, task_id");

  if (settlementError) {
    throw settlementError;
  }

  const insertedSettlements = (settlements ?? []) as Array<{ id: string; task_id: string | null }>;
  const insertedTaskIds = insertedSettlements.map((settlement) => settlement.task_id).filter(isString);

  if (insertedTaskIds.length) {
    const { error: taskUpdateError } = await admin
      .from("tasks")
      .update({
        customer_confirmed_at: nowIso,
        settlement_generated_at: nowIso,
        status: transitionTaskStatus(transitionTaskStatus("approved", "customer_confirm"), "generate_settlement"),
      })
      .eq("organization_id", session.organizationId)
      .eq("status", "approved")
      .in("id", insertedTaskIds);

    if (taskUpdateError) {
      throw taskUpdateError;
    }
  }

  await writeAuditLog(admin, {
    organizationId: session.organizationId,
    actorUserId: session.userId,
    action: "tasks.auto_confirm_overdue",
    entityType: "tasks",
    metadata: {
      autoConfirmDays,
      cutoffAt,
      processedCount: insertedTaskIds.length,
      settlementIds: insertedSettlements.map((settlement) => settlement.id),
      skippedCount: tasks.length - insertedTaskIds.length,
      taskIds: insertedTaskIds,
    },
    ...auditContext,
  });

  return {
    autoConfirmDays,
    cutoffAt,
    processedCount: insertedTaskIds.length,
    settlementIds: insertedSettlements.map((settlement) => settlement.id),
    skippedCount: tasks.length - insertedTaskIds.length,
    taskIds: insertedTaskIds,
  };
}

function emptyResult(autoConfirmDays: number, cutoffAt: string | null = null, skippedCount = 0): AutoConfirmOverdueResult {
  return {
    autoConfirmDays,
    cutoffAt,
    processedCount: 0,
    settlementIds: [],
    skippedCount,
    taskIds: [],
  };
}

function relation(value: MemberRow["ranks"]): { settlement_basis_points: number } | null {
  const item = Array.isArray(value) ? value[0] : value;

  if (!item || typeof item.settlement_basis_points !== "number") {
    return null;
  }

  return {
    settlement_basis_points: item.settlement_basis_points,
  };
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}
