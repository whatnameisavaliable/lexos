import type { AiModelListQuery } from "@lexos/shared";
import { buildPaginationMeta } from "@lexos/shared/api";
import type { AiModelRepository } from "../repositories/ai-model.repository.js";
import { createAiCredentialCrypto } from "../lib/ai-credential-crypto.js";
import type { AiRuntimeEnvConfig } from "@lexos/shared/config";
import { toAiModelPublic, type AiModelPublic } from "./ai-model-mapper.js";

export interface AiModelListResponse {
  readonly items: readonly AiModelPublic[];
  readonly meta: ReturnType<typeof buildPaginationMeta>;
}

export class AiModelListService {
  private readonly crypto;

  constructor(
    private readonly aiModelRepository: AiModelRepository,
    aiEnv: AiRuntimeEnvConfig,
  ) {
    this.crypto = createAiCredentialCrypto(aiEnv);
  }

  async list(query: AiModelListQuery): Promise<AiModelListResponse> {
    const result = await this.aiModelRepository.list(query);
    const items = result.items.map((row) =>
      toAiModelPublic(row, this.crypto.decrypt(row.api_key_ciphertext)),
    );
    return {
      items,
      meta: buildPaginationMeta(query.limit, result.nextCursor),
    };
  }
}
