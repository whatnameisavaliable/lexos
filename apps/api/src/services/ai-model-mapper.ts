import { maskApiKey, type AiModelPublic } from "@lexos/shared";
import type { AiModelRowDb } from "../repositories/ai-model.types.js";
import type { AiPromptRowDb } from "../repositories/ai-prompt.repository.js";
import type { AiFeatureMappingRowDb } from "../repositories/ai-feature-mapping.repository.js";
import type { AiInvocationLogRowDb } from "../repositories/ai-invocation-log.repository.js";

/**
 * 将仓库行映射为对外模�?DTO（掩�?apiKey）�?
 */
export function toAiModelPublic(
  row: AiModelRowDb,
  decryptedApiKey: string,
): AiModelPublic {
  return {
    id: row.id,
    name: row.name,
    providerKind: row.provider_kind,
    modelName: row.model_name,
    modelId: row.model_id,
    apiKeyMasked: maskApiKey(decryptedApiKey),
    baseUrl: row.base_url,
    contextWindow: row.context_window,
    isEnabled: row.is_enabled,
    isDefaultFallback: row.is_default_fallback,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Prompt 列表/详情 DTO�?*/
export interface AiPromptPublic {
  readonly id: string;
  readonly featureKey: AiPromptRowDb["feature_key"];
  readonly name: string;
  readonly systemPrompt: string;
  readonly version: number;
  readonly isPublished: boolean;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function toAiPromptPublic(row: AiPromptRowDb): AiPromptPublic {
  return {
    id: row.id,
    featureKey: row.feature_key,
    name: row.name,
    systemPrompt: row.system_prompt,
    version: row.version,
    isPublished: row.is_published,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** 功能映射 DTO�?*/
export interface AiFeatureMappingPublic {
  readonly featureKey: AiFeatureMappingRowDb["feature_key"];
  readonly primaryModelId: string | null;
  readonly fallbackModelId: string | null;
  readonly updatedAt: string | null;
}

export function toAiFeatureMappingPublic(
  featureKey: AiFeatureMappingRowDb["feature_key"],
  row: AiFeatureMappingRowDb | null,
): AiFeatureMappingPublic {
  return {
    featureKey,
    primaryModelId: row?.primary_model_id ?? null,
    fallbackModelId: row?.fallback_model_id ?? null,
    updatedAt: row?.updated_at ?? null,
  };
}

/** 调用日志 DTO�?*/
export interface AiInvocationLogPublic {
  readonly id: string;
  readonly taskId: string | null;
  readonly featureKey: string;
  readonly modelId: string;
  readonly isFallback: boolean;
  readonly inputTokens: number | null;
  readonly outputTokens: number | null;
  readonly latencyMs: number;
  readonly outcome: string;
  readonly errorCode: string | null;
  readonly createdAt: string;
}

export function toAiInvocationLogPublic(
  row: AiInvocationLogRowDb,
): AiInvocationLogPublic {
  return {
    id: row.id,
    taskId: row.task_id,
    featureKey: row.feature_key,
    modelId: row.model_id,
    isFallback: row.is_fallback,
    inputTokens: row.input_tokens,
    outputTokens: row.output_tokens,
    latencyMs: row.latency_ms,
    outcome: row.outcome,
    errorCode: row.error_code,
    createdAt: row.created_at,
  };
}
