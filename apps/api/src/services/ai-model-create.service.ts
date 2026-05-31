import type { AiModelCreateBody, AuthContext } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import type { AiRuntimeEnvConfig } from "@lexos/shared/config";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { createAiCredentialCrypto } from "../lib/ai-credential-crypto.js";
import type { AiModelRepository } from "../repositories/ai-model.repository.js";
import type { AuditWriterService, AuditRequestMeta } from "./audit-writer.service.js";
import { toAiModelPublic } from "./ai-model-mapper.js";

export interface AiModelCreateMeta {
  readonly ip?: string;
  readonly userAgent?: string;
}

export class AiModelCreateService {
  private readonly crypto;

  constructor(
    private readonly aiModelRepository: AiModelRepository,
    private readonly auditWriterService: AuditWriterService,
    aiEnv: AiRuntimeEnvConfig,
  ) {
    this.crypto = createAiCredentialCrypto(aiEnv);
  }

  async create(
    actor: AuthContext,
    body: AiModelCreateBody,
    meta: AiModelCreateMeta = {},
  ) {
    try {
      const row = await this.aiModelRepository.create({
        name: body.name,
        providerKind: body.providerKind,
        modelName: body.modelName,
        modelId: body.modelId,
        apiKeyCiphertext: this.crypto.encrypt(body.apiKey),
        baseUrl: body.baseUrl ?? null,
        contextWindow: body.contextWindow ?? null,
        isEnabled: body.isEnabled ?? true,
        isDefaultFallback: body.isDefaultFallback ?? false,
        createdBy: actor.userId,
      });

      await this.auditWriterService.write({actorId: actor.userId,
        action: "ai.model.upsert",
        targetType: "ai_model_credentials",
        targetId: row.id,
        metadata: {
          model_id: row.model_id,
          fields_changed: ["create"],
        }}, { ip: meta.ip ?? null, userAgent: meta.userAgent ?? null });

      return toAiModelPublic(row, body.apiKey);
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
