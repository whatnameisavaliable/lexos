import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  AdminSopStepUpsert,
  AdminSopTemplateCreateBody,
  AdminSopTemplateVersionDetail,
} from "@lexos/shared";
import type { SupabaseEnvConfig } from "@lexos/shared/config";
import {
  mapVersionDetail,
  toStepInsertRows,
  type AdminSopListResult,
  type AdminSopTemplateDetail,
  type SopStepRowDb,
  type SopTemplateRowDb,
  type SopTemplateVersionJoinRowDb,
  type SopTemplateVersionRowDb,
} from "./admin-sop.types.js";

const TEMPLATE_SELECT = "id, name, case_type, created_by, created_at";
const VERSION_SELECT =
  "id, template_id, version_number, is_published, published_at, created_by, created_at";
const STEP_SELECT =
  "id, template_version_id, step_code, name, execution_type, ai_feature_key, prompt_template_id, input_schema, depends_on, requires_verification, created_at";

const DEFAULT_LIST_LIMIT = 50;

/**
 * 管理员 SOP 模板仓储（`service_role`；`architecture.md` §5.4）。
 */
export class AdminSopRepository {
  /**
   * @param serviceClient - Supabase `service_role` 客户端（禁止暴露给 HTTP 响应）
   */
  constructor(private readonly serviceClient: SupabaseClient) {}

  /** 从环境配置构造仓库。 */
  static fromSupabaseEnv(supabaseEnv: SupabaseEnvConfig): AdminSopRepository {
    const client = createClient(
      supabaseEnv.supabaseUrl,
      supabaseEnv.supabaseServiceRoleKey,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    return new AdminSopRepository(client);
  }

  /**
   * 分页列出模板及其版本摘要（默认 limit 50）。
   */
  async listTemplatesWithVersions(
    limit: number = DEFAULT_LIST_LIMIT,
    cursor?: string,
  ): Promise<AdminSopListResult> {
    const fetchLimit = limit + 1;
    let builder = this.serviceClient
      .from("sop_templates")
      .select(`${TEMPLATE_SELECT}, sop_template_versions (${VERSION_SELECT})`)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (cursor) {
      const { createdAt, id } = decodeListCursor(cursor);
      builder = builder.or(
        `created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`,
      );
    }

    const { data, error } = await builder.limit(fetchLimit);
    if (error) {
      throw new Error(`sop_templates.list failed: ${error.message}`);
    }

    const rows = (data ?? []) as SopTemplateVersionJoinRowDb[];
    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;

    const items = pageRows.map((row) => {
      const versionsRaw = row.sop_template_versions;
      const versions = Array.isArray(versionsRaw)
        ? versionsRaw
        : versionsRaw
          ? [versionsRaw]
          : [];
      return {
        templateId: row.id,
        name: row.name,
        caseType: row.case_type,
        createdAt: row.created_at,
        versions: versions
          .map((v) => ({
            versionId: v.id,
            versionNumber: v.version_number,
            isPublished: v.is_published,
            publishedAt: v.published_at,
            createdAt: v.created_at,
          }))
          .sort((a, b) => b.versionNumber - a.versionNumber),
      };
    });

    let nextCursor: string | undefined;
    if (hasMore && pageRows.length > 0) {
      const last = pageRows[pageRows.length - 1]!;
      nextCursor = encodeListCursor(last.created_at, last.id);
    }

    return { items, nextCursor };
  }

  /**
   * 创建逻辑模板 + 初始草稿版本（`version_number=0`）及可选步骤。
   */
  async insertTemplateWithInitialDraft(
    actorId: string,
    dto: AdminSopTemplateCreateBody,
  ): Promise<{ readonly templateId: string; readonly versionId: string }> {
    const { data: template, error: templateError } = await this.serviceClient
      .from("sop_templates")
      .insert({
        name: dto.name,
        case_type: dto.caseType,
        created_by: actorId,
      })
      .select(TEMPLATE_SELECT)
      .single();

    if (templateError || !template) {
      throw new Error(
        `sop_templates.insert failed: ${templateError?.message ?? "unknown"}`,
      );
    }

    const templateRow = template as SopTemplateRowDb;

    const { data: version, error: versionError } = await this.serviceClient
      .from("sop_template_versions")
      .insert({
        template_id: templateRow.id,
        version_number: 0,
        is_published: false,
        created_by: actorId,
      })
      .select(VERSION_SELECT)
      .single();

    if (versionError || !version) {
      await this.serviceClient
        .from("sop_templates")
        .delete()
        .eq("id", templateRow.id);
      throw new Error(
        `sop_template_versions.insert failed: ${versionError?.message ?? "unknown"}`,
      );
    }

    const versionRow = version as SopTemplateVersionRowDb;

    if (dto.steps && dto.steps.length > 0) {
      try {
        await this.insertSteps(versionRow.id, dto.steps);
      } catch (err) {
        await this.serviceClient
          .from("sop_template_versions")
          .delete()
          .eq("id", versionRow.id);
        await this.serviceClient
          .from("sop_templates")
          .delete()
          .eq("id", templateRow.id);
        throw err;
      }
    }

    return { templateId: templateRow.id, versionId: versionRow.id };
  }

  /** 按 ID 查询逻辑模板及版本摘要。 */
  async findTemplateById(templateId: string): Promise<AdminSopTemplateDetail | null> {
    const { data, error } = await this.serviceClient
      .from("sop_templates")
      .select(`${TEMPLATE_SELECT}, sop_template_versions (${VERSION_SELECT})`)
      .eq("id", templateId)
      .maybeSingle();

    if (error) {
      throw new Error(`sop_templates.find failed: ${error.message}`);
    }
    if (!data) {
      return null;
    }

    const row = data as SopTemplateVersionJoinRowDb;
    const versionsRaw = row.sop_template_versions;
    const versions = Array.isArray(versionsRaw)
      ? versionsRaw
      : versionsRaw
        ? [versionsRaw]
        : [];

    return {
      templateId: row.id,
      name: row.name,
      caseType: row.case_type,
      createdAt: row.created_at,
      versions: versions
        .map((v) => ({
          versionId: v.id,
          versionNumber: v.version_number,
          isPublished: v.is_published,
          publishedAt: v.published_at,
          createdAt: v.created_at,
        }))
        .sort((a, b) => b.versionNumber - a.versionNumber),
    };
  }

  /** 按 ID 查询模板版本（含按 `step_code` 排序的步骤）。 */
  async findTemplateVersionById(
    versionId: string,
  ): Promise<AdminSopTemplateVersionDetail | null> {
    const { data: version, error: versionError } = await this.serviceClient
      .from("sop_template_versions")
      .select(`${VERSION_SELECT}, sop_templates (${TEMPLATE_SELECT})`)
      .eq("id", versionId)
      .maybeSingle();

    if (versionError) {
      throw new Error(
        `sop_template_versions.find failed: ${versionError.message}`,
      );
    }
    if (!version) {
      return null;
    }

    const versionRow = version as SopTemplateVersionRowDb & {
      sop_templates: SopTemplateRowDb | SopTemplateRowDb[];
    };
    const templateRaw = versionRow.sop_templates;
    const template = Array.isArray(templateRaw) ? templateRaw[0] : templateRaw;
    if (!template) {
      return null;
    }

    const { data: steps, error: stepsError } = await this.serviceClient
      .from("sop_steps")
      .select(STEP_SELECT)
      .eq("template_version_id", versionId)
      .order("step_code", { ascending: true });

    if (stepsError) {
      throw new Error(`sop_steps.list failed: ${stepsError.message}`);
    }

    return mapVersionDetail(
      versionRow,
      template,
      (steps ?? []) as SopStepRowDb[],
    );
  }

  /**
   * 整包替换草稿步骤（删除旧行后批量 INSERT）。
   */
  async replaceDraftSteps(
    versionId: string,
    steps: readonly AdminSopStepUpsert[],
  ): Promise<void> {
    const { error: deleteError } = await this.serviceClient
      .from("sop_steps")
      .delete()
      .eq("template_version_id", versionId);

    if (deleteError) {
      throw new Error(`sop_steps.delete failed: ${deleteError.message}`);
    }

    if (steps.length === 0) {
      return;
    }

    await this.insertSteps(versionId, steps);
  }

  /**
   * 基于源版本复制为新草稿版本（`is_published=false`）。
   */
  async copyVersionToNewDraft(
    templateId: string,
    sourceVersionId: string,
    actorId: string,
  ): Promise<string> {
    const source = await this.findTemplateVersionById(sourceVersionId);
    if (!source || source.templateId !== templateId) {
      throw new Error("Source version not found for template");
    }

    const nextNumber = await this.maxVersionNumber(templateId);
    const newVersionNumber = nextNumber + 1;

    const { data: version, error: versionError } = await this.serviceClient
      .from("sop_template_versions")
      .insert({
        template_id: templateId,
        version_number: newVersionNumber,
        is_published: false,
        created_by: actorId,
      })
      .select(VERSION_SELECT)
      .single();

    if (versionError || !version) {
      throw new Error(
        `sop_template_versions.copy insert failed: ${versionError?.message ?? "unknown"}`,
      );
    }

    const versionId = (version as SopTemplateVersionRowDb).id;

    if (source.steps.length > 0) {
      const rows = source.steps.map((step: AdminSopTemplateVersionDetail["steps"][number]) => ({
        template_version_id: versionId,
        step_code: step.stepCode,
        name: step.name,
        execution_type: step.executionType,
        ai_feature_key: step.aiFeatureKey,
        prompt_template_id: step.promptTemplateId,
        input_schema: step.inputSchema,
        depends_on: [...step.dependsOn],
        requires_verification: step.requiresVerification,
      }));

      const { error: stepsError } = await this.serviceClient
        .from("sop_steps")
        .insert(rows);

      if (stepsError) {
        await this.serviceClient
          .from("sop_template_versions")
          .delete()
          .eq("id", versionId);
        throw new Error(`sop_steps.copy failed: ${stepsError.message}`);
      }
    }

    return versionId;
  }

  /**
   * 发布版本：设置 `is_published`、`version_number`、`published_at`。
   */
  async publishVersion(
    versionId: string,
    nextVersionNumber: number,
    publishedAt: string,
  ): Promise<void> {
    const { error } = await this.serviceClient
      .from("sop_template_versions")
      .update({
        is_published: true,
        version_number: nextVersionNumber,
        published_at: publishedAt,
      })
      .eq("id", versionId)
      .eq("is_published", false);

    if (error) {
      throw new Error(`sop_template_versions.publish failed: ${error.message}`);
    }
  }

  /** 取模板下已发布版本的最大 `version_number`。 */
  async maxPublishedVersionNumber(templateId: string): Promise<number> {
    const { data, error } = await this.serviceClient
      .from("sop_template_versions")
      .select("version_number")
      .eq("template_id", templateId)
      .eq("is_published", true)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(
        `sop_template_versions.maxPublished failed: ${error.message}`,
      );
    }
    return data ? (data as { version_number: number }).version_number : 0;
  }

  /** 取模板下最新已发布版本 ID。 */
  async findLatestPublishedVersionId(
    templateId: string,
  ): Promise<string | null> {
    const { data, error } = await this.serviceClient
      .from("sop_template_versions")
      .select("id")
      .eq("template_id", templateId)
      .eq("is_published", true)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(
        `sop_template_versions.latestPublished failed: ${error.message}`,
      );
    }
    return data ? (data as { id: string }).id : null;
  }

  /** 按 `prompt_template_id` 加载 Prompt 正文。 */
  async findPromptBodiesByIds(
    promptIds: readonly string[],
  ): Promise<Readonly<Record<string, string>>> {
    if (promptIds.length === 0) {
      return {};
    }

    const { data, error } = await this.serviceClient
      .from("ai_prompt_templates")
      .select("id, system_prompt")
      .in("id", [...promptIds]);

    if (error) {
      throw new Error(`ai_prompt_templates.find failed: ${error.message}`);
    }

    const map: Record<string, string> = {};
    for (const row of data ?? []) {
      const r = row as { id: string; system_prompt: string };
      map[r.id] = r.system_prompt;
    }
    return map;
  }

  /** 判断功能点是否已配置 AI 模型映射。 */
  async hasFeatureMapping(featureKey: string): Promise<boolean> {
    const { data, error } = await this.serviceClient
      .from("ai_feature_model_mappings")
      .select("feature_key")
      .eq("feature_key", featureKey)
      .maybeSingle();

    if (error) {
      throw new Error(`ai_feature_model_mappings.find failed: ${error.message}`);
    }
    return Boolean(data);
  }

  private async maxVersionNumber(templateId: string): Promise<number> {
    const { data, error } = await this.serviceClient
      .from("sop_template_versions")
      .select("version_number")
      .eq("template_id", templateId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`sop_template_versions.max failed: ${error.message}`);
    }
    return data ? (data as { version_number: number }).version_number : 0;
  }

  private async insertSteps(
    versionId: string,
    steps: readonly AdminSopStepUpsert[],
  ): Promise<void> {
    const { error } = await this.serviceClient
      .from("sop_steps")
      .insert(toStepInsertRows(versionId, steps));

    if (error) {
      throw new Error(`sop_steps.insert failed: ${error.message}`);
    }
  }
}

function encodeListCursor(createdAt: string, id: string): string {
  return Buffer.from(JSON.stringify({ createdAt, id }), "utf8").toString(
    "base64url",
  );
}

function decodeListCursor(cursor: string): { createdAt: string; id: string } {
  const parsed = JSON.parse(
    Buffer.from(cursor, "base64url").toString("utf8"),
  ) as { createdAt: string; id: string };
  return parsed;
}
