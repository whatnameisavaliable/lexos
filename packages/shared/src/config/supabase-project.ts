import fs from "node:fs";
import path from "node:path";
import { resolveRepoRoot } from "./env.js";

/** 远端 Supabase 项目引用 ID（`supabase link --project-ref`）。 */
export const SUPABASE_PROJECT_REF_ENV = "SUPABASE_PROJECT_REF";

/**
 * 从 `SUPABASE_URL` 提取 project ref（`https://<ref>.supabase.co`）。
 */
export function parseProjectRefFromSupabaseUrl(supabaseUrl: string): string {
  const match = /^https:\/\/([a-z0-9]+)\.supabase\.co\/?$/i.exec(
    supabaseUrl.trim(),
  );
  if (!match?.[1]) {
    throw new Error(
      `Invalid SUPABASE_URL format (expected https://<ref>.supabase.co): ${supabaseUrl}`,
    );
  }
  return match[1];
}

/**
 * 读取 CLI `supabase link` 写入的 project ref 文件。
 */
export function readLinkedProjectRef(
  repoRoot: string = resolveRepoRoot(),
): string {
  const refPath = path.join(repoRoot, "supabase", ".temp", "project-ref");
  if (!fs.existsSync(refPath)) {
    throw new Error(
      `Missing linked project ref file. Run: supabase link --project-ref <ref> (${refPath})`,
    );
  }
  return fs.readFileSync(refPath, "utf8").trim();
}

/**
 * 断言本地 link 的 project ref 与 `SUPABASE_URL` / `SUPABASE_PROJECT_REF` 一致。
 */
export function assertLinkedProjectMatchesEnv(
  supabaseUrl: string,
  linkedRef: string,
  explicitRef?: string,
): void {
  const expected =
    explicitRef?.trim() ||
    process.env[SUPABASE_PROJECT_REF_ENV]?.trim() ||
    parseProjectRefFromSupabaseUrl(supabaseUrl);

  if (linkedRef !== expected) {
    throw new Error(
      `Linked project ref "${linkedRef}" does not match expected "${expected}"`,
    );
  }
}
