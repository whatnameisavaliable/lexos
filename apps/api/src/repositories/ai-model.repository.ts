import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AiModelListQuery } from "@lexos/shared";
import type { SupabaseEnvConfig } from "@lexos/shared/config";
import {
  AI_MODEL_LIST_SELECT,
  decodeAiModelCursor,
  encodeAiModelCursor,
  type AiModelInsertInput,
  type AiModelListResult,
  type AiModelPatchInput,
  type AiModelRowDb,
} from "./ai-model.types.js";

/**
 * `ai_model_credentials` 管理员仓库（`service_role`；`architecture.md` §5.4）。
 */
export class AiModelRepository {
  constructor(private readonly serviceClient: SupabaseClient) {}

  static fromSupabaseEnv(supabaseEnv: SupabaseEnvConfig): AiModelRepository {
    const client = createClient(
      supabaseEnv.supabaseUrl,
      supabaseEnv.supabaseServiceRoleKey,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    return new AiModelRepository(client);
  }

  async list(query: AiModelListQuery): Promise<AiModelListResult> {
    const fetchLimit = query.limit + 1;
    let builder = this.serviceClient
      .from("ai_model_credentials")
      .select(AI_MODEL_LIST_SELECT)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (query.providerKind) {
      builder = builder.eq("provider_kind", query.providerKind);
    }
    if (query.isEnabled !== undefined) {
      builder = builder.eq("is_enabled", query.isEnabled);
    }
    if (query.cursor) {
      const { createdAt, id } = decodeAiModelCursor(query.cursor);
      builder = builder.or(
        `created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`,
      );
    }

    const { data, error } = await builder.limit(fetchLimit);
    if (error) {
      throw new Error(`ai_model_credentials.list failed: ${error.message}`);
    }

    const rows = (data ?? []) as AiModelRowDb[];
    const hasMore = rows.length > query.limit;
    const pageRows = hasMore ? rows.slice(0, query.limit) : rows;

    let nextCursor: string | undefined;
    if (hasMore && pageRows.length > 0) {
      const last = pageRows[pageRows.length - 1]!;
      nextCursor = encodeAiModelCursor(last.created_at, last.id);
    }

    return { items: pageRows, nextCursor };
  }

  async findById(id: string): Promise<AiModelRowDb | null> {
    const { data, error } = await this.serviceClient
      .from("ai_model_credentials")
      .select(AI_MODEL_LIST_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`ai_model_credentials.findById failed: ${error.message}`);
    }
    return (data as AiModelRowDb | null) ?? null;
  }

  async create(input: AiModelInsertInput): Promise<AiModelRowDb> {
    const { data, error } = await this.serviceClient
      .from("ai_model_credentials")
      .insert({
        name: input.name,
        provider_kind: input.providerKind,
        model_name: input.modelName,
        model_id: input.modelId,
        api_key_ciphertext: input.apiKeyCiphertext,
        base_url: input.baseUrl ?? null,
        context_window: input.contextWindow ?? null,
        is_enabled: input.isEnabled,
        is_default_fallback: input.isDefaultFallback,
        created_by: input.createdBy,
      })
      .select(AI_MODEL_LIST_SELECT)
      .single();

    if (error) {
      throw mapUniqueViolation(error.message, input.isDefaultFallback);
    }
    return data as AiModelRowDb;
  }

  async update(id: string, patch: AiModelPatchInput): Promise<AiModelRowDb> {
    const row: Record<string, unknown> = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.providerKind !== undefined) {
      row.provider_kind = patch.providerKind;
    }
    if (patch.modelName !== undefined) row.model_name = patch.modelName;
    if (patch.modelId !== undefined) row.model_id = patch.modelId;
    if (patch.apiKeyCiphertext !== undefined) {
      row.api_key_ciphertext = patch.apiKeyCiphertext;
    }
    if (patch.baseUrl !== undefined) row.base_url = patch.baseUrl;
    if (patch.contextWindow !== undefined) {
      row.context_window = patch.contextWindow;
    }
    if (patch.isEnabled !== undefined) row.is_enabled = patch.isEnabled;
    if (patch.isDefaultFallback !== undefined) {
      row.is_default_fallback = patch.isDefaultFallback;
    }

    const { data, error } = await this.serviceClient
      .from("ai_model_credentials")
      .update(row)
      .eq("id", id)
      .select(AI_MODEL_LIST_SELECT)
      .single();

    if (error) {
      throw mapUniqueViolation(error.message, patch.isDefaultFallback === true);
    }
    return data as AiModelRowDb;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.serviceClient
      .from("ai_model_credentials")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`ai_model_credentials.delete failed: ${error.message}`);
    }
  }

  /**
   * 是否存在引用该模型的功能映射。
   */
  async hasMappingReference(modelId: string): Promise<boolean> {
    const { data, error } = await this.serviceClient
      .from("ai_feature_model_mappings")
      .select("feature_key")
      .or(`primary_model_id.eq.${modelId},fallback_model_id.eq.${modelId}`)
      .limit(1);

    if (error) {
      throw new Error(
        `ai_feature_model_mappings reference check failed: ${error.message}`,
      );
    }
    return (data?.length ?? 0) > 0;
  }
}

function mapUniqueViolation(
  message: string,
  isDefaultFallback?: boolean,
): Error {
  if (
    message.includes("ai_model_credentials_default_fallback_uidx") ||
    (isDefaultFallback && message.includes("duplicate"))
  ) {
    const err = new Error("DEFAULT_FALLBACK_CONFLICT");
    return err;
  }
  return new Error(`ai_model_credentials write failed: ${message}`);
}
