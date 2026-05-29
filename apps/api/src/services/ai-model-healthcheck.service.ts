import { ErrorCode } from "@lexos/shared/api";
import type { AiRuntimeEnvConfig } from "@lexos/shared/config";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AiAdapterFactory } from "../adapters/ai/ai-adapter.factory.js";
import { toModelCredentials } from "../adapters/ai/model-credentials.mapper.js";
import type { HealthCheckResult } from "../adapters/ai/model-credentials.dto.js";
import { createAiCredentialCrypto } from "../lib/ai-credential-crypto.js";
import type { AiModelRepository } from "../repositories/ai-model.repository.js";

export interface AiModelHealthcheckResponse extends HealthCheckResult {
  readonly modelId: string;
}

export class AiModelHealthcheckService {
  private readonly crypto;

  constructor(
    private readonly aiModelRepository: AiModelRepository,
    private readonly adapterFactory: AiAdapterFactory,
    private readonly aiTestTimeoutMs: number,
    aiEnv: AiRuntimeEnvConfig,
  ) {
    this.crypto = createAiCredentialCrypto(aiEnv);
  }

  async test(modelId: string): Promise<AiModelHealthcheckResponse> {
    const row = await this.aiModelRepository.findById(modelId);
    if (!row) {
      throw new AppHttpError(ErrorCode.RESOURCE_NOT_FOUND, "Model not found");
    }

    const apiKey = this.crypto.decrypt(row.api_key_ciphertext);
    const credentials = toModelCredentials(row, apiKey);
    const adapter = this.adapterFactory.get(row.provider_kind);

    const result = await Promise.race([
      adapter.healthCheck(credentials, { timeoutMs: this.aiTestTimeoutMs }),
      timeoutFailure(this.aiTestTimeoutMs),
    ]);

    return { ...result, modelId: row.id };
  }
}

function timeoutFailure(ms: number): Promise<HealthCheckResult> {
  return new Promise((resolve) => {
    setTimeout(
      () =>
        resolve({
          success: false,
          latencyMs: ms,
          message: "timeout",
          errorCode: "AI_PROVIDER_TIMEOUT",
        }),
      ms + 50,
    );
  });
}
