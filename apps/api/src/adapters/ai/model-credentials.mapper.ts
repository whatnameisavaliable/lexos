import type { AiModelRowDb } from "../../repositories/ai-model.types.js";
import type { ModelCredentials } from "./model-credentials.dto.js";

/**
 * 将 DB 行 + 解密后的 apiKey 映射为 Adapter 凭证 DTO。
 * @param row - 数据库行（含 `api_key_ciphertext`）
 * @param apiKey - 已解密明文（禁止记录日志）
 */
export function toModelCredentials(
  row: Pick<
    AiModelRowDb,
    "provider_kind" | "model_id" | "model_name" | "base_url"
  >,
  apiKey: string,
): ModelCredentials {
  return {
    providerKind: row.provider_kind,
    modelId: row.model_id,
    modelName: row.model_name,
    apiKey,
    baseUrl: row.base_url,
  };
}
