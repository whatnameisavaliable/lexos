import type { AuditAction, AuditLogItem } from "@lexos/shared";

/** `audit_logs` 数据库行（snake_case）。 */
export interface AuditLogRowDb {
  readonly id: string;
  readonly actor_id: string | null;
  readonly action: AuditAction;
  readonly target_type: string | null;
  readonly target_id: string | null;
  readonly ip_address: string | null;
  readonly user_agent: string | null;
  readonly metadata: Record<string, unknown>;
  readonly row_hash: string;
  readonly created_at: string;
}

/** 列表查询结果。 */
export interface AuditLogListResult {
  readonly items: readonly AuditLogItem[];
  readonly nextCursor?: string;
}

/**
 * 将 `audit_logs` 行映射为 API `AuditLogItem`（metadata camelCase 辅助字段）。
 */
export function mapAuditLogRow(row: AuditLogRowDb): AuditLogItem {
  const metadata = { ...(row.metadata ?? {}) };
  const clientTimestamp =
    typeof metadata.client_timestamp === "string"
      ? metadata.client_timestamp
      : undefined;
  const clientTimezone =
    typeof metadata.client_timezone === "string"
      ? metadata.client_timezone
      : undefined;

  return {
    id: row.id,
    action: row.action,
    actorId: row.actor_id,
    targetType: row.target_type,
    targetId: row.target_id,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    metadata: {
      ...metadata,
      ...(clientTimestamp ? { clientTimestamp } : {}),
      ...(clientTimezone ? { clientTimezone } : {}),
    },
    createdAt: row.created_at,
    rowHash: row.row_hash,
  };
}
