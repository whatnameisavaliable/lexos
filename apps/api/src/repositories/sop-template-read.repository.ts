import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { SopPublishedTemplateItem } from "@lexos/shared";
import type { SupabaseEnvConfig } from "@lexos/shared/config";

/** 已发布模板列表分页参数。 */
export interface PublishedTemplatesPagination {
  readonly limit: number;
  readonly cursor?: string;
}

/** 已发布模板列表结果。 */
export interface PublishedTemplatesListResult {
  readonly items: readonly SopPublishedTemplateItem[];
  readonly nextCursor?: string;
}

interface PublishedVersionJoinRowDb {
  readonly id: string;
  readonly version_number: number;
  readonly published_at: string | null;
  readonly sop_templates: {
    readonly name: string;
    readonly case_type: string;
  } | {
    readonly name: string;
    readonly case_type: string;
  }[];
}

const PUBLISHED_VERSION_SELECT =
  "id, version_number, published_at, sop_templates (name, case_type)";

/**
 * 律师端已发布 SOP 模板只读仓储（用户 JWT + RLS；`database.md` §3.16.6）。
 */
export class SopTemplateReadRepository {
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;

  constructor(supabaseEnv: SupabaseEnvConfig) {
    this.supabaseUrl = supabaseEnv.supabaseUrl;
    this.supabaseAnonKey = supabaseEnv.supabaseAnonKey;
  }

  /**
   * 分页列出已发布模板版本（含模板名与案由类型）。
   */
  async listPublishedTemplates(
    accessToken: string,
    pagination: PublishedTemplatesPagination,
  ): Promise<PublishedTemplatesListResult> {
    const client = this.userClient(accessToken);
    const fetchLimit = pagination.limit + 1;

    let query = client
      .from("sop_template_versions")
      .select(PUBLISHED_VERSION_SELECT)
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .order("id", { ascending: false });

    if (pagination.cursor) {
      const { publishedAt, id } = decodePublishedTemplatesCursor(pagination.cursor);
      query = query.or(
        `published_at.lt.${publishedAt},and(published_at.eq.${publishedAt},id.lt.${id})`,
      );
    }

    const { data, error } = await query.limit(fetchLimit);
    if (error) {
      throw new Error(
        `sop_template_versions.listPublishedTemplates failed: ${error.message}`,
      );
    }

    const rows = (data ?? []) as PublishedVersionJoinRowDb[];
    const hasMore = rows.length > pagination.limit;
    const pageRows = hasMore ? rows.slice(0, pagination.limit) : rows;

    const items = pageRows.map((row) => {
      const templateRaw = row.sop_templates;
      const template = Array.isArray(templateRaw) ? templateRaw[0] : templateRaw;
      if (!template) {
        throw new Error("sop_template_versions missing nested sop_templates");
      }
      return {
        templateVersionId: row.id,
        templateName: template.name,
        caseType: template.case_type,
        versionNumber: row.version_number,
      } satisfies SopPublishedTemplateItem;
    });

    const last = pageRows.at(-1);
    const nextCursor =
      hasMore && last?.published_at
        ? encodePublishedTemplatesCursor(last.published_at, last.id)
        : undefined;

    return { items, nextCursor };
  }

  private userClient(accessToken: string): SupabaseClient {
    return createClient(this.supabaseUrl, this.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  }
}

function encodePublishedTemplatesCursor(publishedAt: string, id: string): string {
  return Buffer.from(JSON.stringify({ publishedAt, id }), "utf8").toString(
    "base64url",
  );
}

function decodePublishedTemplatesCursor(cursor: string): {
  publishedAt: string;
  id: string;
} {
  const parsed = JSON.parse(
    Buffer.from(cursor, "base64url").toString("utf8"),
  ) as { publishedAt: string; id: string };
  return parsed;
}
