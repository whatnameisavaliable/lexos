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
    requiredSnippets: ["CREATE TYPE public.user_role AS ENUM", "CREATE TYPE public.audit_action AS ENUM"],
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
