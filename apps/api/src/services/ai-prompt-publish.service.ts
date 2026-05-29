import type { AuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AiPromptRepository } from "../repositories/ai-prompt.repository.js";
import type { AuditLogRepository } from "../repositories/audit-log.repository.js";
import { toAiPromptPublic } from "./ai-model-mapper.js";

export interface AiPromptPublishMeta {
  readonly ip?: string;
  readonly userAgent?: string;
}

export class AiPromptPublishService {
  constructor(
    private readonly promptRepository: AiPromptRepository,
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  async publish(
    actor: AuthContext,
    id: string,
    meta: AiPromptPublishMeta = {},
  ) {
    const existing = await this.promptRepository.findById(id);
    if (!existing) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Prompt not found");
    }

    const row = await this.promptRepository.publish(id);

    await this.auditLogRepository.append({
      actorId: actor.userId,
      action: "ai.prompt.publish",
      targetType: "ai_prompt_templates",
      targetId: row.id,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      metadata: {
        feature_key: row.feature_key,
        version: row.version,
      },
    });

    return toAiPromptPublic(row);
  }
}
