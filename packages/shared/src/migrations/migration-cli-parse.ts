import fs from "node:fs";
import path from "node:path";
import { resolveRepoRoot } from "../config/env.js";

/**
 * 从 `supabase migration list` 表格解析 Local/Remote 已同步的时间戳（二者相等时）。
 */
export function parseSyncedMigrationTimestamps(cliOutput: string): string[] {
  const timestamps: string[] = [];
  for (const line of cliOutput.split(/\r?\n/)) {
    const match = /^\s*(\d{14})\s*\|\s*(\d{14})\s*\|/.exec(line);
    if (match && match[1] === match[2]) {
      timestamps.push(match[1]);
    }
  }
  return timestamps;
}

/**
 * 列出仓库内迁移文件的逻辑名（`<timestamp>_<name>.sql` → `name`）。
 */
export function listLocalMigrationNames(
  repoRoot: string = resolveRepoRoot(),
): string[] {
  const dir = path.join(repoRoot, "supabase", "migrations");
  return fs
    .readdirSync(dir)
    .filter((f) => /^\d{14}_[a-z0-9_]+\.sql$/.test(f))
    .map((f) => f.replace(/^\d{14}_/, "").replace(/\.sql$/, ""))
    .sort();
}

/**
 * 列出仓库内迁移文件的时间戳前缀。
 */
export function listLocalMigrationTimestamps(
  repoRoot: string = resolveRepoRoot(),
): string[] {
  const dir = path.join(repoRoot, "supabase", "migrations");
  return fs
    .readdirSync(dir)
    .filter((f) => /^\d{14}_[a-z0-9_]+\.sql$/.test(f))
    .map((f) => f.slice(0, 14))
    .sort();
}
