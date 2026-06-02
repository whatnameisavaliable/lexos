import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseEnvConfig } from "@lexos/shared/config";
import {
  mapSopStepRow,
  type SopStepRowDb,
} from "./admin-sop.types.js";

/** 模板版本步骤只读快照（`sop_steps` 行映射）。 */
export type SopStepSnapshot = ReturnType<typeof mapSopStepRow>;

const STEP_SELECT =
  "id, template_version_id, step_code, name, execution_type, ai_feature_key, prompt_template_id, input_schema, depends_on, requires_verification, created_at";

/**
 * SOP 步骤快照只读仓储（律师 JWT；RLS 仅 `is_published` 版本步骤）。
 */
export class SopStepSnapshotRepository {
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;

  constructor(supabaseEnv: SupabaseEnvConfig) {
    this.supabaseUrl = supabaseEnv.supabaseUrl;
    this.supabaseAnonKey = supabaseEnv.supabaseAnonKey;
  }

  /**
   * 按 `template_version_id` 读取步骤快照（`step_code` 升序）。
   */
  async listStepsByTemplateVersionId(
    accessToken: string,
    templateVersionId: string,
  ): Promise<readonly SopStepSnapshot[]> {
    const client = this.userClient(accessToken);
    const { data, error } = await client
      .from("sop_steps")
      .select(STEP_SELECT)
      .eq("template_version_id", templateVersionId)
      .order("step_code", { ascending: true });

    if (error) {
      throw new Error(`sop_steps.listByTemplateVersion failed: ${error.message}`);
    }

    return ((data ?? []) as SopStepRowDb[]).map(mapSopStepRow);
  }

  private userClient(accessToken: string): SupabaseClient {
    return createClient(this.supabaseUrl, this.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  }
}
