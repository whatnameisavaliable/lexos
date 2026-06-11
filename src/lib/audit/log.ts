import type { SupabaseClient } from "@supabase/supabase-js";

import { rowsToCsv } from "../csv.ts";

export type AuditLogInput = {
  organizationId: string;
  action: string;
  entityType: string;
  actorUserId?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
};

export type AuditLogExportRow = {
  action: string;
  actorDisplayName?: string;
  actorUsername?: string;
  createdAt: string;
  entityId?: string;
  entityType: string;
  ipAddress?: string;
  metadata?: Record<string, unknown> | null;
  userAgent?: string;
};

export function buildAuditLogInsert(input: AuditLogInput): Record<string, unknown> {
  return {
    organization_id: input.organizationId,
    actor_user_id: input.actorUserId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    metadata: input.metadata ?? {},
    ip_address: input.ipAddress,
    user_agent: input.userAgent,
  };
}

export function auditLogsToCsv(rows: AuditLogExportRow[]): string {
  return rowsToCsv(
    ["时间", "操作人", "用户名", "动作", "对象类型", "对象ID", "IP", "User-Agent", "元数据"],
    rows.map((row) => [
      row.createdAt,
      row.actorDisplayName ?? "",
      row.actorUsername ?? "",
      row.action,
      row.entityType,
      row.entityId ?? "",
      row.ipAddress ?? "",
      row.userAgent ?? "",
      row.metadata ? JSON.stringify(row.metadata) : "",
    ]),
  );
}

export function getAuditRequestContext(request: Request): Pick<AuditLogInput, "ipAddress" | "userAgent"> {
  const forwardedFor = request.headers.get("x-forwarded-for");

  return {
    ipAddress: forwardedFor?.split(",")[0]?.trim() || undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };
}

export async function writeAuditLog(admin: SupabaseClient, input: AuditLogInput): Promise<void> {
  try {
    const { error } = await admin.from("audit_logs").insert(buildAuditLogInsert(input));

    if (error) {
      console.warn("[audit] write failed", error.message);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    console.warn("[audit] write failed", message);
  }
}
