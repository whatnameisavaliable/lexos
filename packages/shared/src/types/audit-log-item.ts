import type { AuditAction } from "../constants/audit-required-events.js";

/**
 * 审计 `metadata` 中浏览器侧时序字段（`database.md` §3.11）。
 */
export interface AuditLogClientMetadata {
  readonly clientTimestamp?: string;
  readonly clientTimezone?: string;
}

/**
 * `GET /api/admin/audit/logs` 列表行 / 详情（camelCase API 契约）。
 * 不向前端暴露链校验内部密钥；`rowHash` 仅作完整性展示。
 */
export interface AuditLogItem {
  readonly id: string;
  readonly action: AuditAction;
  readonly actorId: string | null;
  readonly targetType: string | null;
  readonly targetId: string | null;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
  readonly metadata: AuditLogClientMetadata & Record<string, unknown>;
  readonly createdAt: string;
  readonly rowHash: string;
}
