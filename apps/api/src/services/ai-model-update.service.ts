import type { AiModelUpdateBody, AuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import type { AiRuntimeEnvConfig } from "@lexos/shared/config";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { createAiCredentialCrypto } from "../lib/ai-credential-crypto.js";
import type { AiModelRepository } from "../repositories/ai-model.repository.js";
import type { AuditWriterService, AuditRequestMeta } from "./audit-writer.service.js";
import { toAiModelPublic } from "./ai-model-mapper.js";

export interface AiModelUpdateMeta {
  readonly ip?: string;
  readonly userAgent?: string;
}

export class AiModelUpdateService {
  private readonly crypto;

  constructor(
    private readonly aiModelRepository: AiModelRepository,
    private readonly auditWriterService: AuditWriterService,
    aiEnv: AiRuntimeEnvConfig,
  ) {
    this.crypto = createAiCredentialCrypto(aiEnv);
  }

  async update(
    actor: AuthContext,
    id: string,
    body: AiModelUpdateBody,
    meta: AiModelUpdateMeta = {},
  ) {
    const existing = await this.aiModelRepository.findById(id);
    if (!existing) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Model not found");
    }

    const fieldsChanged: string[] = [];
    if (body.name !== undefined) fieldsChanged.push("name");
    if (body.providerKind !== undefined) fieldsChanged.push("providerKind");
    if (body.modelName !== undefined) fieldsChanged.push("modelName");
    if (body.modelId !== undefined) fieldsChanged.push("modelId");
    if (body.apiKey !== undefined) fieldsChanged.push("apiKey");
    if (body.baseUrl !== undefined) fieldsChanged.push("baseUrl");
    if (body.contextWindow !== undefined) fieldsChanged.push("contextWindow");
    if (body.isEnabled !== undefined) fieldsChanged.push("isEnabled");
    if (body.isDefaultFallback !== undefined) {
      fieldsChanged.push("isDefaultFallback");
    }

    try {
      const row = await this.aiModelRepository.update(id, {
        name: body.name,
        providerKind: body.providerKind,
        modelName: body.modelName,
        modelId: body.modelId,
        apiKeyCiphertext:
          body.apiKey !== undefined
            ? this.crypto.encrypt(body.apiKey)
            : undefined,
        baseUrl: body.baseUrl,
        contextWindow: body.contextWindow,
        isEnabled: body.isEnabled,
        isDefaultFallback: body.isDefaultFallback,
      });

      await this.auditWriterService.write({actorId: actor.userId,
        action: "ai.model.upsert",
        targetType: "ai_model_credentials",
        targetId: row.id,
        metadata: {
          model_id: row.model_id,
          fields_changed: fieldsChanged,
        }}, { ip: meta.ip ?? null, userAgent: meta.userAgent ?? null });

      const apiKey =
        body.apiKey !== undefined
          ? body.apiKey
          : this.crypto.decrypt(row.api_key_ciphertext);
      return toAiModelPublic(row, apiKey);
    } catch (err) {
      if (err instanceof Error && err.message === "DEFAULT_FALLBACK_CONFLICT") {
        throw new AppHttpError(
          ErrorCode.VALIDATION_FAILED,
          "Only one default fallback model is allowed",
        );
      }
      throw err;
    }
  }
}
