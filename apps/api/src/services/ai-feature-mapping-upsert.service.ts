import type { AiFeatureKey, AiFeatureMappingUpsertBody, AuthContext } from "@lexos/shared";
import { isAdminConfigurableFeatureKey } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AiFeatureMappingRepository } from "../repositories/ai-feature-mapping.repository.js";
import type { AuditWriterService, AuditRequestMeta } from "./audit-writer.service.js";
import { toAiFeatureMappingPublic } from "./ai-model-mapper.js";

export interface AiFeatureMappingUpsertMeta {
  readonly ip?: string;
  readonly userAgent?: string;
}

export class AiFeatureMappingUpsertService {
  constructor(
    private readonly mappingRepository: AiFeatureMappingRepository,
    private readonly auditWriterService: AuditWriterService,
  ) {}

  async upsert(
    actor: AuthContext,
    featureKey: string,
    body: AiFeatureMappingUpsertBody,
    meta: AiFeatureMappingUpsertMeta = {},
  ) {
    if (!isAdminConfigurableFeatureKey(featureKey)) {
      throw new AppHttpError(
        ErrorCode.OPERATION_NOT_ALLOWED,
        "Feature key is not active in this release",
      );
    }

    const row = await this.mappingRepository.upsert(featureKey, body);

    await this.auditWriterService.write({actorId: actor.userId,
      action: "ai.mapping.upsert",
      targetType: "ai_feature_model_mappings",
      targetId: null,
      metadata: {
        feature_key: featureKey,
        primary_model_id: body.primaryModelId,
        fallback_model_id: body.fallbackModelId ?? null,
      }}, { ip: meta.ip ?? null, userAgent: meta.userAgent ?? null });

    return toAiFeatureMappingPublic(featureKey as AiFeatureKey, row);
  }
}
