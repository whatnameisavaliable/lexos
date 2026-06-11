import type { SupabaseClient } from "@supabase/supabase-js";

import { ApiError } from "../api/errors.ts";
import type { AuditLogInput } from "../audit/log.ts";
import { writeAuditLog } from "../audit/log.ts";
import type { InternalSession } from "../auth/session.ts";
import { transitionTaskStatus } from "../domain/core.ts";
import { formatTaskRiskFreezeError } from "../risk/task-freeze.ts";
import { loadTaskRiskFreezeMap } from "../risk/task-freeze-service.ts";
import {
  buildSettlementRiskLockStatus,
  isSettlementConfirmationLocked,
  loadSystemSettingNumber,
  settlementLockUntil,
} from "../settings/runtime.ts";

export const MAX_BULK_SETTLEMENT_CONFIRMATIONS = 100;

type SettlementConfirmationRecord = {
  generated_at: string | null;
  id: string;
  status: string;
  task_id: string;
};

export type ConfirmSettlementsResult = {
  confirmedCount: number;
  settlements: Array<{
    confirmed_at: string | null;
    id: string;
    status: string;
  }>;
};

export function normalizeSettlementIdList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new ApiError(400, "BAD_REQUEST", "请选择需要确认的结算记录");
  }

  const ids = Array.from(
    new Set(value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean)),
  );

  if (!ids.length) {
    throw new ApiError(400, "BAD_REQUEST", "请选择需要确认的结算记录");
  }

  if (ids.length > MAX_BULK_SETTLEMENT_CONFIRMATIONS) {
    throw new ApiError(400, "BAD_REQUEST", `一次最多确认 ${MAX_BULK_SETTLEMENT_CONFIRMATIONS} 条结算记录`);
  }

  return ids;
}

export async function confirmSettlements(
  admin: SupabaseClient,
  session: InternalSession,
  settlementIds: string[],
  auditContext: Pick<AuditLogInput, "ipAddress" | "userAgent"> = {},
): Promise<ConfirmSettlementsResult> {
  const { data, error } = await admin
    .from("settlements")
    .select("id, task_id, status, generated_at")
    .eq("organization_id", session.organizationId)
    .in("id", settlementIds);

  if (error) {
    throw error;
  }

  const settlements = (data ?? []) as SettlementConfirmationRecord[];
  const settlementsById = new Map(settlements.map((settlement) => [settlement.id, settlement]));
  const missingIds = settlementIds.filter((settlementId) => !settlementsById.has(settlementId));

  if (missingIds.length) {
    throw new ApiError(404, "NOT_FOUND", "部分结算记录不存在或无权访问");
  }

  const unavailable = settlements.find((settlement) => settlement.status !== "pending");

  if (unavailable) {
    throw new ApiError(409, "CONFLICT", "所选结算中包含不可确认记录，请刷新后重试");
  }

  const taskIds = Array.from(new Set(settlements.map((settlement) => settlement.task_id).filter(Boolean)));
  const riskFreezeMap = await loadTaskRiskFreezeMap(admin, session.organizationId, taskIds);
  const frozenTaskId = taskIds.find((taskId) => riskFreezeMap.get(taskId)?.frozen);

  if (frozenTaskId) {
    const freezeStatus = riskFreezeMap.get(frozenTaskId);

    throw new ApiError(409, "CONFLICT", freezeStatus ? formatTaskRiskFreezeError(freezeStatus) : "任务金额处于风控冻结状态");
  }

  const settlementLockDays = await loadSystemSettingNumber(admin, session.organizationId, "settlement_lock_days");
  const lockedSettlement = settlements.find((settlement) =>
    session.roleCode !== "system_admin" &&
    isSettlementConfirmationLocked(settlement.generated_at, settlementLockDays),
  );

  if (lockedSettlement) {
    const lockStatus = buildSettlementRiskLockStatus(lockedSettlement.generated_at, settlementLockDays);
    const lockedUntil = settlementLockUntil(lockedSettlement.generated_at, settlementLockDays);

    throw new ApiError(
      409,
      "CONFLICT",
      `所选结算仍在 ${settlementLockDays} 天风控锁定期，剩余约 ${lockStatus.daysRemaining} 天，预计 ${lockedUntil?.toLocaleString("zh-CN", { hour12: false }) ?? "锁定期结束"} 后可确认`,
    );
  }

  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await admin
    .from("settlements")
    .update({
      status: "confirmed",
      confirmed_by: session.userId,
      confirmed_at: now,
    })
    .eq("organization_id", session.organizationId)
    .eq("status", "pending")
    .in("id", settlementIds)
    .select("id, status, confirmed_at");

  if (updateError) {
    throw updateError;
  }

  const updatedSettlements = (updated ?? []) as ConfirmSettlementsResult["settlements"];

  if (updatedSettlements.length !== settlementIds.length) {
    throw new ApiError(409, "CONFLICT", "部分结算状态已变更，请刷新后重试");
  }

  const { error: taskError } = await admin
    .from("tasks")
    .update({ status: transitionTaskStatus("settlement_pending", "settle") })
    .eq("organization_id", session.organizationId)
    .eq("status", "settlement_pending")
    .in("id", taskIds);

  if (taskError) {
    throw taskError;
  }

  const auditMetadata: Record<string, unknown> =
    settlementIds.length === 1
      ? { taskId: taskIds[0] }
      : {
          count: settlementIds.length,
          settlementIds,
          taskIds,
        };

  if (settlementLockDays > 0) {
    auditMetadata.settlementLockDays = settlementLockDays;
    auditMetadata.settlementRiskLockBypassed = session.roleCode === "system_admin";
  }

  await writeAuditLog(admin, {
    organizationId: session.organizationId,
    actorUserId: session.userId,
    action: settlementIds.length === 1 ? "settlements.confirm" : "settlements.bulk_confirm",
    entityType: "settlements",
    entityId: settlementIds.length === 1 ? settlementIds[0] : undefined,
    metadata: auditMetadata,
    ...auditContext,
  });

  return {
    confirmedCount: updatedSettlements.length,
    settlements: updatedSettlements,
  };
}
