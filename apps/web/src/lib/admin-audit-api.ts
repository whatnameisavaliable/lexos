import type { AuditLogItem, AuditLogsQuery } from "@lexos/shared";
import type { PaginationMeta } from "@lexos/shared/api";
import { apiFetch } from "./api-client";

export interface AuditLogListData {
  readonly items: readonly AuditLogItem[];
  readonly meta: PaginationMeta;
}

function buildQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, value);
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/** `GET /api/admin/audit/logs` */
export async function listAuditLogs(
  query: Partial<AuditLogsQuery> = {},
): Promise<AuditLogListData> {
  const res = await apiFetch<AuditLogListData>(
    `/admin/audit/logs${buildQuery({
      limit: query.limit !== undefined ? String(query.limit) : undefined,
      cursor: query.cursor,
      action: query.action,
      actorId: query.actorId,
      targetType: query.targetType,
      from: query.from,
      to: query.to,
    })}`,
    { method: "GET" },
  );
  return res.data;
}

/** `GET /api/admin/audit/logs/:id` */
export async function getAuditLog(id: string): Promise<AuditLogItem> {
  const res = await apiFetch<AuditLogItem>(`/admin/audit/logs/${id}`, {
    method: "GET",
  });
  return res.data;
}
