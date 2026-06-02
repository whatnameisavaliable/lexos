import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AiFeatureKey } from "@lexos/shared";
import type { AiRuntimeEnvConfig, SupabaseEnvConfig } from "@lexos/shared/config";
import { toModelCredentials } from "../adapters/ai/model-credentials.mapper.js";
import type { ModelCredentials } from "../adapters/ai/model-credentials.dto.js";
import { createAiCredentialCrypto } from "../lib/ai-credential-crypto.js";

/** 解析后的 SOP AI 模型（含 DB UUID 与上下文窗口）。 */
export interface SopResolvedModel {
  readonly credentials: ModelCredentials;
  readonly modelUuid: string;
  readonly contextWindow: number | null;
}

/**
 * SOP AI 配置仓库：功能映射 + 已发布 Prompt（`service_role`；禁止日志输出 apiKey）。
 */
export class SopAiConfigRepository {
  private readonly crypto;

  constructor(
    private readonly serviceClient: SupabaseClient,
    aiEnv: AiRuntimeEnvConfig,
  ) {
    this.crypto = createAiCredentialCrypto(aiEnv);
  }

  static fromSupabaseEnv(
    supabaseEnv: SupabaseEnvConfig,
    aiEnv: AiRuntimeEnvConfig,
  ): SopAiConfigRepository {
    const client = createClient(
      supabaseEnv.supabaseUrl,
      supabaseEnv.supabaseServiceRoleKey,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    return new SopAiConfigRepository(client, aiEnv);
  }

  async resolveModelsForFeature(featureKey: AiFeatureKey): Promise<{
    readonly primary: SopResolvedModel;
    readonly fallback: SopResolvedModel | null;
  }> {
    const { data: mapping, error: mappingError } = await this.serviceClient
      .from("ai_feature_model_mappings")
      .select("primary_model_id, fallback_model_id")
      .eq("feature_key", featureKey)
      .maybeSingle();

    if (mappingError || !mapping) {
      throw new Error("AI mapping not found");
    }

    const primary = await this.loadModel(mapping.primary_model_id as string);
    const fallback = mapping.fallback_model_id
      ? await this.loadModel(mapping.fallback_model_id as string)
      : null;
    return { primary, fallback };
  }

  async findPublishedPrompt(featureKey: AiFeatureKey): Promise<string> {
    const { data, error } = await this.serviceClient
      .from("ai_prompt_templates")
      .select("system_prompt")
      .eq("feature_key", featureKey)
      .eq("is_published", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data?.system_prompt) {
      throw new Error(`Published prompt not found for ${featureKey}`);
    }
    return data.system_prompt as string;
  }

  private async loadModel(modelUuid: string): Promise<SopResolvedModel> {
    const { data, error } = await this.serviceClient
      .from("ai_model_credentials")
      .select(
        "id, provider_kind, model_id, model_name, base_url, api_key_ciphertext, is_enabled, context_window",
      )
      .eq("id", modelUuid)
      .maybeSingle();

    if (error || !data || !data.is_enabled) {
      throw new Error(`AI model not found or disabled: ${modelUuid}`);
    }

    const apiKey = this.crypto.decrypt(data.api_key_ciphertext as string);
    return {
      credentials: toModelCredentials(
        {
          provider_kind: data.provider_kind,
          model_id: data.model_id,
          model_name: data.model_name,
          base_url: data.base_url,
        },
        apiKey,
      ),
      modelUuid: data.id as string,
      contextWindow: (data.context_window as number | null) ?? null,
    };
  }
}
