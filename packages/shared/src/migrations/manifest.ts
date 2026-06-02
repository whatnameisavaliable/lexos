import fs from "node:fs";
import path from "node:path";
import { resolveRepoRoot } from "../config/env.js";

/** 单条迁移元数据（与 `supabase/migrations/<timestamp>_<name>.sql` 对应）。 */
export interface MigrationManifestEntry {
  /** 迁移逻辑名（文件名 snake_case 后缀） */
  readonly name: string;
  /** 文件中必须出现的 SQL 片段（大小写敏感子串） */
  readonly requiredSnippets: readonly string[];
}

/** M0-B 已登记的迁移（按应用顺序）。 */
export const M0_B_MIGRATIONS: readonly MigrationManifestEntry[] = [
  {
    name: "extensions_pg_trgm",
    requiredSnippets: ["CREATE EXTENSION IF NOT EXISTS pg_trgm"],
  },
  {
    name: "enums",
    requiredSnippets: [
      "CREATE TYPE public.user_role AS ENUM",
      "CREATE TYPE public.audit_action AS ENUM",
    ],
  },
  {
    name: "table_profiles",
    requiredSnippets: [
      "CREATE TABLE public.profiles",
      "REFERENCES auth.users",
      "profiles_set_updated_at",
    ],
  },
  {
    name: "tables_ai_config",
    requiredSnippets: [
      "CREATE TABLE public.ai_model_credentials",
      "ai_model_credentials_default_fallback_uidx",
    ],
  },
  {
    name: "table_transcription_tasks",
    requiredSnippets: [
      "CREATE TABLE public.transcription_tasks",
      "transcription_tasks_stalled_idx",
    ],
  },
  {
    name: "tables_transcription_children",
    requiredSnippets: [
      "CREATE TABLE public.transcription_segments",
      "gin_trgm_ops",
    ],
  },
  {
    name: "table_drive_nodes",
    requiredSnippets: [
      "drive_nodes_file_requires_parent",
      "transcription_tasks_archive_folder_id_fkey",
    ],
  },
  {
    name: "tables_pipeline",
    requiredSnippets: [
      "CREATE TABLE public.outbox_events",
      "outbox_events_unpublished_idx",
    ],
  },
  {
    name: "tables_audit_system",
    requiredSnippets: [
      "CREATE TABLE public.audit_logs",
      "REVOKE UPDATE, DELETE ON public.audit_logs",
    ],
  },
  {
    name: "functions_security",
    requiredSnippets: [
      "transition_task_status",
      "append_audit_log",
      "complete_password_change",
    ],
  },
  {
    name: "triggers_business_rules",
    requiredSnippets: ["transcription_tasks_validate_limits"],
  },
  {
    name: "rls_policies",
    requiredSnippets: ["profiles_select_self", "segments_select"],
  },
  {
    name: "triggers_immutable",
    requiredSnippets: ["audit_log_immutable", "profiles_guard_self_update"],
  },
  {
    name: "storage_buckets_policies",
    requiredSnippets: ["media_select_path_owner", "exports_select_path_owner"],
  },
];

/** M10 已登记的 SOP 迁移（按应用顺序）。 */
export const M10_MIGRATIONS: readonly MigrationManifestEntry[] = [
  {
    name: "enums_sop",
    requiredSnippets: [
      "CREATE TYPE public.sop_execution_type AS ENUM",
      "CREATE TYPE public.case_pipeline_status AS ENUM",
      "CREATE TYPE public.pipeline_artifact_status AS ENUM",
      "CREATE TYPE public.artifact_content_type AS ENUM",
      "ADD VALUE IF NOT EXISTS 'sop.fact_extract'",
      "ADD VALUE IF NOT EXISTS 'sop.strategy_gen'",
      "ADD VALUE IF NOT EXISTS 'sop.deep_research'",
      "ADD VALUE IF NOT EXISTS 'sop.visual_charting'",
    ],
  },
  {
    name: "audit_action_sop",
    requiredSnippets: [
      "sop.template.publish",
      "sop.prompt.update",
      "sop.artifact.export_pdf",
      "sop.artifact.verify",
    ],
  },
  {
    name: "tables_sop_templates",
    requiredSnippets: [
      "CREATE TABLE public.sop_templates",
      "case_type VARCHAR",
    ],
  },
  {
    name: "tables_sop_template_versions",
    requiredSnippets: [
      "CREATE TABLE public.sop_template_versions",
      "UNIQUE (template_id, version_number)",
      "is_published",
    ],
  },
  {
    name: "tables_sop_steps",
    requiredSnippets: [
      "CREATE TABLE public.sop_steps",
      "UNIQUE (template_version_id, step_code)",
      "depends_on",
      "sop_execution_type",
    ],
  },
  {
    name: "tables_case_pipelines",
    requiredSnippets: [
      "CREATE TABLE public.case_pipelines",
      "case_pipeline_status",
      "lawyer_id",
      "REFERENCES public.sop_template_versions",
    ],
  },
  {
    name: "tables_pipeline_artifacts",
    requiredSnippets: [
      "CREATE TABLE public.pipeline_artifacts",
      "finalized_snapshot_raw",
      "UNIQUE (pipeline_id, step_code)",
      "pipeline_artifacts_set_updated_at",
      "linked_drive_node_id UUID REFERENCES public.drive_nodes",
    ],
  },
  {
    name: "upload_sessions_sop",
    requiredSnippets: [
      "pipeline_id UUID",
      "task_id DROP NOT NULL",
      "upload_sessions_task_or_pipeline_chk",
    ],
  },
  {
    name: "rls_sop",
    requiredSnippets: [
      "sop_templates ENABLE ROW LEVEL SECURITY",
      "case_pipelines ENABLE ROW LEVEL SECURITY",
      "pipeline_artifacts ENABLE ROW LEVEL SECURITY",
      "is_published = true",
    ],
  },
  {
    name: "storage_exports_sop_path",
    requiredSnippets: ["exports_insert_path_owner", "'sops'"],
  },
  {
    name: "seed_system_settings_sop",
    requiredSnippets: [
      "INSERT INTO public.system_settings",
      "sop.deep_research_enabled",
    ],
  },
];

/** M11 已登记的 AI/SOP 编排迁移（按应用顺序）。 */
export const M11_MIGRATIONS: readonly MigrationManifestEntry[] = [
  {
    name: "ai_invocation_logs_sop_metadata",
    requiredSnippets: [
      "metadata JSONB",
      "DEFAULT '{}'::jsonb",
      "ai_invocation_logs_metadata_gin_idx",
      "USING gin (metadata jsonb_path_ops)",
    ],
  },
];

/**
 * 解析 `supabase/migrations` 下匹配 `*_<name>.sql` 的文件路径。
 */
export function resolveMigrationFile(
  name: string,
  repoRoot: string = resolveRepoRoot(),
): string {
  const dir = path.join(repoRoot, "supabase", "migrations");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(`_${name}.sql`));
  if (files.length !== 1) {
    throw new Error(
      `Expected exactly one migration for "${name}", found: ${files.join(", ") || "(none)"}`,
    );
  }
  return path.join(dir, files[0]!);
}

/**
 * 断言迁移文件存在且包含约定 SQL 片段。
 */
export function assertMigrationContent(
  entry: MigrationManifestEntry,
  repoRoot: string = resolveRepoRoot(),
): void {
  const filePath = resolveMigrationFile(entry.name, repoRoot);
  const sql = fs.readFileSync(filePath, "utf8");
  for (const snippet of entry.requiredSnippets) {
    if (!sql.includes(snippet)) {
      throw new Error(
        `Migration ${entry.name} missing required snippet: ${snippet}`,
      );
    }
  }
}

/**
 * 断言 manifest 中列出的全部迁移均已落盘且内容合规。
 */
export function assertMigrationsManifest(
  entries: readonly MigrationManifestEntry[] = M0_B_MIGRATIONS,
  repoRoot: string = resolveRepoRoot(),
): void {
  for (const entry of entries) {
    assertMigrationContent(entry, repoRoot);
  }
}

/**
 * 返回 manifest 中迁移的逻辑名列表（用于与 `supabase migration list` 对照，B15）。
 */
export function listExpectedMigrationNames(): readonly string[] {
  return M0_B_MIGRATIONS.map((e) => e.name);
}

/**
 * 返回 M10 manifest 中迁移的逻辑名列表。
 */
export function listExpectedM10MigrationNames(): readonly string[] {
  return M10_MIGRATIONS.map((e) => e.name);
}

/**
 * 返回 M11 manifest 中迁移的逻辑名列表。
 */
export function listExpectedM11MigrationNames(): readonly string[] {
  return M11_MIGRATIONS.map((e) => e.name);
}
