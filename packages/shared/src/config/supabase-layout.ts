import fs from "node:fs";
import path from "node:path";
import { resolveRepoRoot } from "./env.js";

/** Supabase 目录布局契约（M0-A）。 */
export interface SupabaseLayoutPaths {
  readonly migrationsDir: string;
  readonly seedFile: string;
}

export function getSupabaseLayoutPaths(
  repoRoot: string = resolveRepoRoot(),
): SupabaseLayoutPaths {
  const supabaseRoot = path.join(repoRoot, "supabase");
  return {
    migrationsDir: path.join(supabaseRoot, "migrations"),
    seedFile: path.join(supabaseRoot, "seed.sql"),
  };
}

/**
 * 断言 `supabase/migrations/` 与 `supabase/seed.sql` 存在（M0-A 验收）。
 */
export function assertSupabaseLayout(repoRoot: string = resolveRepoRoot()): void {
  const paths = getSupabaseLayoutPaths(repoRoot);
  if (!fs.existsSync(paths.migrationsDir)) {
    throw new Error(`Missing migrations directory: ${paths.migrationsDir}`);
  }
  if (!fs.statSync(paths.migrationsDir).isDirectory()) {
    throw new Error(`Not a directory: ${paths.migrationsDir}`);
  }
  if (!fs.existsSync(paths.seedFile)) {
    throw new Error(`Missing seed file: ${paths.seedFile}`);
  }
}
