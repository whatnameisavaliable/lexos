import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AiFeatureKey } from "@lexos/shared";
import type { AiRuntimeEnvConfig, SupabaseEnvConfig } from "@lexos/shared/config";
import { toModelCredentials } from "../../../../apps/api/src/adapters/ai/model-credentials.mapper.js";
import type { ModelCredentials } from "../../../../apps/api/src/adapters/ai/model-credentials.dto.js";
import { createAiCredentialCrypto } from "../../../../apps/api/src/lib/ai-credential-crypto.js";
import type { PoolClient } from "pg";
import type { WorkerAiCredentials } from "../adapters/ai/worker-ai-client.port.js";

/** 调用日志写入入参。 */
export interface AiInvocationLogInput {
  readonly taskId: string;
  readonly featureKey: AiFeatureKey;
  readonly modelId: string;
  readonly isFallback: boolean;
  readonly latencyMs: number;
  readonly outcome: "success" | "failure";
  readonly errorCode?: string | null;
  readonly inputTokens?: number | null;
  readonly outputTokens?: number | null;
  readonly idempotencyKey: string;
}

/**
 * Worker AI 配置与调用日志仓库（`service_role`）。
 */
export class WorkerAiRepository {
  private readonly client: SupabaseClient;
  private readonly crypto;

  constructor(
    supabaseEnv: Pick<
      SupabaseEnvConfig,
      "supabaseUrl" | "supabaseServiceRoleKey"
    >,
    aiEnv: AiRuntimeEnvConfig,
  ) {
    this.client = createClient(
      supabaseEnv.supabaseUrl,
      supabaseEnv.supabaseServiceRoleKey,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    this.crypto = createAiCredentialCrypto(aiEnv);
  }

  /** 解析功能点映射的主模型与 fallback 凭证。 */
  async resolveModelsForFeature(featureKey: AiFeatureKey): Promise<{
    readonly primary: ModelCredentials & { readonly modelUuid: string };
    readonly fallback: (ModelCredentials & { readonly modelUuid: string }) | null;
  }> {
    const { data: mapping, error: mappingError } = await this.client
      .from("ai_feature_model_mappings")
      .select("primary_model_id, fallback_model_id")
      .eq("feature_key", featureKey)
      .maybeSingle();
    if (mappingError || !mapping) {
      throw new Error(`AI mapping not found for ${featureKey}`);
    }

    const primary = await this.loadModelCredentials(mapping.primary_model_id);
    const fallback = mapping.fallback_model_id
      ? await this.loadModelCredentials(mapping.fallback_model_id)
      : null;
    return { primary, fallback };
  }

  /** 读取已发布 Prompt 模板。 */
  async findPublishedPrompt(featureKey: AiFeatureKey): Promise<string> {
    const { data, error } = await this.client
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

  /** 写入 `ai_invocation_logs`（幂等键由调用方生成）。 */
  async insertInvocationLog(
    client: PoolClient,
    input: AiInvocationLogInput,
  ): Promise<void> {
    await client.query(
      `INSERT INTO public.ai_invocation_logs (
         task_id, feature_key, model_id, is_fallback,
         input_tokens, output_tokens, latency_ms, outcome, error_code
       ) VALUES (
         $1::uuid, $2::public.ai_feature_key, $3::uuid, $4,
         $5, $6, $7, $8, $9
       )`,
      [
        input.taskId,
        input.featureKey,
        input.modelId,
        input.isFallback,
        input.inputTokens ?? null,
        input.outputTokens ?? null,
        input.latencyMs,
        input.outcome,
        input.errorCode ?? null,
      ],
    );
    void input.idempotencyKey;
  }

  /** 生成外部调用幂等键（`architecture.md` §3.2.5.2）。 */
  static buildIdempotencyKey(parts: readonly string[]): string {
    return createHash("sha256").update(parts.join(":")).digest("hex");
  }

  private async loadModelCredentials(
    modelUuid: string,
  ): Promise<ModelCredentials & { readonly modelUuid: string }> {
    const { data, error } = await this.client
      .from("ai_model_credentials")
      .select(
        "id, provider_kind, model_id, model_name, base_url, api_key_ciphertext, is_enabled",
      )
      .eq("id", modelUuid)
      .maybeSingle();
    if (error || !data || !data.is_enabled) {
      throw new Error(`AI model not found or disabled: ${modelUuid}`);
    }
    const apiKey = this.crypto.decrypt(data.api_key_ciphertext as string);
    return {
      ...toModelCredentials(
        {
          provider_kind: data.provider_kind,
          model_id: data.model_id,
          model_name: data.model_name,
          base_url: data.base_url,
        },
        apiKey,
      ),
      modelUuid: data.id as string,
    };
  }
}

/** 映射为 Worker AI 客户端凭证。 */
export function toWorkerAiCredentials(
  model: ModelCredentials & { readonly modelUuid: string },
): WorkerAiCredentials {
  return {
    modelId: model.modelUuid,
    providerKind: model.providerKind,
    modelName: model.modelName,
    apiKey: model.apiKey,
    baseUrl: model.baseUrl,
  };
}
