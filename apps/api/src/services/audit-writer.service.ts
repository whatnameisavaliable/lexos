import type { AuditAction } from "@lexos/shared";
import {
  mergeAuditClientMetadata,
  type ParsedAuditClientMetadata,
} from "../lib/audit-client-metadata.js";
import type { AuditLogRepository } from "../repositories/audit-log.repository.js";

/** 单次审计写入请求上下文（IP、UA、浏览器时序）。 */
export interface AuditWriterRequestContext {
  readonly ip?: string | null;
  readonly userAgent?: string | null;
  readonly client?: ParsedAuditClientMetadata;
}

/** BFF 控制器传入的审计元数据（别名，便于各 Service 复用）。 */
export type AuditRequestMeta = AuditWriterRequestContext;

/** 审计写入入参（业务 metadata 与目标）。 */
export interface AuditWriterInput {
  readonly actorId: string | null;
  readonly action: AuditAction;
  readonly targetType?: string;
  readonly targetId?: string | null;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * 统一审计写入：合并 IP/UA 与浏览器 `client_timestamp`/`client_timezone` 后调用 `append_audit_log`。
 */
export class AuditWriterService {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  /**
   * 追加一条审计记录；返回新行 `id`。
   */
  async write(
    input: AuditWriterInput,
    context: AuditWriterRequestContext = {},
  ): Promise<string> {
    const metadata = mergeAuditClientMetadata(
      input.metadata,
      context.client ?? {},
    );

    return this.auditLogRepository.append({
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      ip: context.ip ?? null,
      userAgent: context.userAgent ?? null,
      metadata,
    });
  }
}
