import type { AiFeatureKey, AiFeatureMappingUpsertBody, AuthContext } from "@lexos/shared";
import { isAiFeatureKey } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AiFeatureMappingRepository } from "../repositories/ai-feature-mapping.repository.js";
import type { AuditLogRepository } from "../repositories/audit-log.repository.js";
import { toAiFeatureMappingPublic } from "./ai-model-mapper.js";

export interface AiFeatureMappingUpsertMeta {
  readonly ip?: string;
  readonly userAgent?: string;
}

export class AiFeatureMappingUpsertService {
  constructor(
    private readonly mappingRepository: AiFeatureMappingRepository,
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  async upsert(
    actor: AuthContext,
    featureKey: string,
    body: AiFeatureMappingUpsertBody,
    meta: AiFeatureMappingUpsertMeta = {},
  ) {
    if (!isAiFeatureKey(featureKey)) {
      throw new AppHttpError(ErrorCode.VALIDATION_FAILED, "Invalid feature key");
    }

    const row = await this.mappingRepository.upsert(featureKey, body);

    await this.auditLogRepository.append({
      actorId: actor.userId,
      action: "ai.mapping.upsert",
      targetType: "ai_feature_model_mappings",
      targetId: null,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      metadata: {
        feature_key: featureKey,
        primary_model_id: body.primaryModelId,
        fallback_model_id: body.fallbackModelId ?? null,
      },
    });

    return toAiFeatureMappingPublic(featureKey as AiFeatureKey, row);
  }
}
