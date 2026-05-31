import { z } from "zod";
import { MAX_PAGE_LIMIT, parseLimit } from "../api/pagination.js";
import {
  AUDIT_ACTION_VALUES,
  type AuditAction,
} from "../constants/audit-required-events.js";

const actionFilterSchema = z.enum(
  [...AUDIT_ACTION_VALUES] as [AuditAction, ...AuditAction[]],
);

const isoDateTimeSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "from/to must be valid ISO8601 datetime",
  });

/**
 * `GET /api/admin/audit/logs` 查询参数（camelCase 经 Controller 映射）。
 */
export const auditLogsQuerySchema = z
  .object({
    limit: z.union([z.string(), z.number()]).optional(),
    cursor: z.string().trim().min(1).optional(),
    action: actionFilterSchema.optional(),
    actorId: z.string().uuid().optional(),
    targetType: z.string().trim().min(1).max(64).optional(),
    from: isoDateTimeSchema.optional(),
    to: isoDateTimeSchema.optional(),
  })
  .refine(
    (value) => {
      if (!value.from || !value.to) {
        return true;
      }
      return Date.parse(value.from) <= Date.parse(value.to);
    },
    { message: "from must be before or equal to to" },
  );

/** 原始查询参数（解析 limit 前）。 */
export type AuditLogsQueryRaw = z.infer<typeof auditLogsQuerySchema>;

/** 审计日志列表查询 DTO（含已解析的 `limit`）。 */
export interface AuditLogsQuery {
  readonly limit: number;
  readonly cursor?: string;
  readonly action?: AuditAction;
  readonly actorId?: string;
  readonly targetType?: string;
  readonly from?: string;
  readonly to?: string;
}

/**
 * 解析并校验审计日志列表查询参数；失败抛出 `ZodError`。
 */
export function parseAuditLogsQuery(input: unknown): AuditLogsQuery {
  const raw = auditLogsQuerySchema.parse(input);
  const limit = parseLimit({ requested: raw.limit, maxLimit: MAX_PAGE_LIMIT });
  return {
    limit,
    cursor: raw.cursor,
    action: raw.action,
    actorId: raw.actorId,
    targetType: raw.targetType,
    from: raw.from,
    to: raw.to,
  };
}
