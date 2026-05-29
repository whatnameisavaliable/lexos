import type { AiModelPublic, AiProviderKind } from "@lexos/shared";
import type { AiModelListQuery } from "@lexos/shared";

/** Supabase `ai_model_credentials` 行（含密文字段，禁止下发 HTTP）。 */
export interface AiModelRowDb {
  readonly id: string;
  readonly name: string;
  readonly provider_kind: AiProviderKind;
  readonly model_name: string;
  readonly model_id: string;
  readonly api_key_ciphertext: string;
  readonly base_url: string | null;
  readonly context_window: number | null;
  readonly is_enabled: boolean;
  readonly is_default_fallback: boolean;
  readonly created_by: string;
  readonly created_at: string;
  readonly updated_at: string;
}

/** 列表查询结果。 */
export interface AiModelListResult {
  readonly items: readonly AiModelRowDb[];
  readonly nextCursor?: string;
}

/** `create` 入参（明文 apiKey 由 Service 加密后写入 `api_key_ciphertext`）。 */
export interface AiModelInsertInput {
  readonly name: string;
  readonly providerKind: AiProviderKind;
  readonly modelName: string;
  readonly modelId: string;
  readonly apiKeyCiphertext: string;
  readonly baseUrl?: string | null;
  readonly contextWindow?: number | null;
  readonly isEnabled: boolean;
  readonly isDefaultFallback: boolean;
  readonly createdBy: string;
}

/** `update` 可写字段。 */
export interface AiModelPatchInput {
  readonly name?: string;
  readonly providerKind?: AiProviderKind;
  readonly modelName?: string;
  readonly modelId?: string;
  readonly apiKeyCiphertext?: string;
  readonly baseUrl?: string | null;
  readonly contextWindow?: number | null;
  readonly isEnabled?: boolean;
  readonly isDefaultFallback?: boolean;
}

export const AI_MODEL_LIST_SELECT =
  "id, name, provider_kind, model_name, model_id, api_key_ciphertext, base_url, context_window, is_enabled, is_default_fallback, created_by, created_at, updated_at";

export function encodeAiModelCursor(createdAt: string, id: string): string {
  return Buffer.from(`${createdAt}|${id}`, "utf8").toString("base64url");
}

export function decodeAiModelCursor(
  cursor: string,
): { readonly createdAt: string; readonly id: string } {
  const decoded = Buffer.from(cursor, "base64url").toString("utf8");
  const sep = decoded.indexOf("|");
  if (sep < 0) {
    throw new Error("Invalid AI model list cursor");
  }
  return {
    createdAt: decoded.slice(0, sep),
    id: decoded.slice(sep + 1),
  };
}

export type { AiModelListQuery, AiModelPublic };
