import { ErrorCode } from "@lexos/shared/api";
import type { AiRuntimeEnvConfig } from "@lexos/shared/config";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { createAiCredentialCrypto } from "../lib/ai-credential-crypto.js";
import type { AiModelRepository } from "../repositories/ai-model.repository.js";
import { toAiModelPublic } from "./ai-model-mapper.js";

export class AiModelGetService {
  private readonly crypto;

  constructor(
    private readonly aiModelRepository: AiModelRepository,
    aiEnv: AiRuntimeEnvConfig,
  ) {
    this.crypto = createAiCredentialCrypto(aiEnv);
  }

  async getById(id: string) {
    const row = await this.aiModelRepository.findById(id);
    if (!row) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Model not found");
    }
    const apiKey = this.crypto.decrypt(row.api_key_ciphertext);
    return toAiModelPublic(row, apiKey);
  }
}
