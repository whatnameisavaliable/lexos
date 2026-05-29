import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AiFeatureKey } from "@lexos/shared";
import type { SupabaseEnvConfig } from "@lexos/shared/config";

/** `ai_prompt_templates` 行。 */
export interface AiPromptRowDb {
  readonly id: string;
  readonly feature_key: AiFeatureKey;
  readonly name: string;
  readonly system_prompt: string;
  readonly version: number;
  readonly is_published: boolean;
  readonly created_by: string;
  readonly created_at: string;
  readonly updated_at: string;
}

const PROMPT_SELECT =
  "id, feature_key, name, system_prompt, version, is_published, created_by, created_at, updated_at";

export interface AiPromptInsertInput {
  readonly featureKey: AiFeatureKey;
  readonly name: string;
  readonly systemPrompt: string;
  readonly createdBy: string;
}

export interface AiPromptPatchInput {
  readonly name?: string;
  readonly systemPrompt?: string;
}

/**
 * Prompt 模板仓库（`service_role`）。
 */
export class AiPromptRepository {
  constructor(private readonly serviceClient: SupabaseClient) {}

  static fromSupabaseEnv(supabaseEnv: SupabaseEnvConfig): AiPromptRepository {
    const client = createClient(
      supabaseEnv.supabaseUrl,
      supabaseEnv.supabaseServiceRoleKey,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    return new AiPromptRepository(client);
  }

  async list(): Promise<readonly AiPromptRowDb[]> {
    const { data, error } = await this.serviceClient
      .from("ai_prompt_templates")
      .select(PROMPT_SELECT)
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(`ai_prompt_templates.list failed: ${error.message}`);
    }
    return (data ?? []) as AiPromptRowDb[];
  }

  async findById(id: string): Promise<AiPromptRowDb | null> {
    const { data, error } = await this.serviceClient
      .from("ai_prompt_templates")
      .select(PROMPT_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`ai_prompt_templates.findById failed: ${error.message}`);
    }
    return (data as AiPromptRowDb | null) ?? null;
  }

  async create(input: AiPromptInsertInput): Promise<AiPromptRowDb> {
    const { data, error } = await this.serviceClient
      .from("ai_prompt_templates")
      .insert({
        feature_key: input.featureKey,
        name: input.name,
        system_prompt: input.systemPrompt,
        created_by: input.createdBy,
      })
      .select(PROMPT_SELECT)
      .single();

    if (error) {
      throw new Error(`ai_prompt_templates.create failed: ${error.message}`);
    }
    return data as AiPromptRowDb;
  }

  async update(id: string, patch: AiPromptPatchInput): Promise<AiPromptRowDb> {
    const row: Record<string, unknown> = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.systemPrompt !== undefined) {
      row.system_prompt = patch.systemPrompt;
    }

    const { data, error } = await this.serviceClient
      .from("ai_prompt_templates")
      .update(row)
      .eq("id", id)
      .select(PROMPT_SELECT)
      .single();

    if (error) {
      throw new Error(`ai_prompt_templates.update failed: ${error.message}`);
    }
    return data as AiPromptRowDb;
  }

  async publish(id: string): Promise<AiPromptRowDb> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error("PROMPT_NOT_FOUND");
    }

    const { data, error } = await this.serviceClient
      .from("ai_prompt_templates")
      .update({
        version: existing.version + 1,
        is_published: true,
      })
      .eq("id", id)
      .select(PROMPT_SELECT)
      .single();

    if (error) {
      throw new Error(`ai_prompt_templates.publish failed: ${error.message}`);
    }
    return data as AiPromptRowDb;
  }
}
