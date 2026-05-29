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
