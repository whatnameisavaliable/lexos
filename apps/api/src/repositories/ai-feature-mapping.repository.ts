import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AiFeatureKey, AiFeatureMappingUpsertBody } from "@lexos/shared";
import { AI_FEATURE_KEY_VALUES } from "@lexos/shared";
import type { SupabaseEnvConfig } from "@lexos/shared/config";

/** `ai_feature_model_mappings` 行。 */
export interface AiFeatureMappingRowDb {
  readonly feature_key: AiFeatureKey;
  readonly primary_model_id: string;
  readonly fallback_model_id: string | null;
  readonly updated_at: string;
}

/**
 * 功能-模型映射仓库（`service_role`）。
 */
export class AiFeatureMappingRepository {
  constructor(private readonly serviceClient: SupabaseClient) {}

  static fromSupabaseEnv(
    supabaseEnv: SupabaseEnvConfig,
  ): AiFeatureMappingRepository {
    const client = createClient(
      supabaseEnv.supabaseUrl,
      supabaseEnv.supabaseServiceRoleKey,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    return new AiFeatureMappingRepository(client);
  }

  async listAll(): Promise<readonly AiFeatureMappingRowDb[]> {
    const { data, error } = await this.serviceClient
      .from("ai_feature_model_mappings")
      .select("feature_key, primary_model_id, fallback_model_id, updated_at");

    if (error) {
      throw new Error(
        `ai_feature_model_mappings.listAll failed: ${error.message}`,
      );
    }
    return (data ?? []) as AiFeatureMappingRowDb[];
  }

  async findByFeatureKey(
    featureKey: AiFeatureKey,
  ): Promise<AiFeatureMappingRowDb | null> {
    const { data, error } = await this.serviceClient
      .from("ai_feature_model_mappings")
      .select("feature_key, primary_model_id, fallback_model_id, updated_at")
      .eq("feature_key", featureKey)
      .maybeSingle();

    if (error) {
      throw new Error(
        `ai_feature_model_mappings.findByFeatureKey failed: ${error.message}`,
      );
    }
    return (data as AiFeatureMappingRowDb | null) ?? null;
  }

  async upsert(
    featureKey: AiFeatureKey,
    body: AiFeatureMappingUpsertBody,
  ): Promise<AiFeatureMappingRowDb> {
    const { data, error } = await this.serviceClient
      .from("ai_feature_model_mappings")
      .upsert(
        {
          feature_key: featureKey,
          primary_model_id: body.primaryModelId,
          fallback_model_id: body.fallbackModelId ?? null,
        },
        { onConflict: "feature_key" },
      )
      .select("feature_key, primary_model_id, fallback_model_id, updated_at")
      .single();

    if (error) {
      throw new Error(
        `ai_feature_model_mappings.upsert failed: ${error.message}`,
      );
    }
    return data as AiFeatureMappingRowDb;
  }

  /** 四功能点枚举（列表占位用）。 */
  allFeatureKeys(): readonly AiFeatureKey[] {
    return AI_FEATURE_KEY_VALUES;
  }
}
