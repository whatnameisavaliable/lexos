import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { loadSupabaseEnv, resolveRepoRoot } from "../config/env.js";
import { resolveSupabaseCli } from "../config/supabase-cli.js";
import { listExpectedMigrationNames, M0_B_MIGRATIONS } from "./manifest.js";

/**
 * 解析 `supabase migration list` 输出中已应用于 Remote 的迁移后缀名。
 */
export function parseAppliedRemoteMigrationNames(cliOutput: string): string[] {
  const names: string[] = [];
  for (const line of cliOutput.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("Local") || trimmed.startsWith("---")) {
      continue;
    }
    const match = /\d{14}_([a-z0-9_]+)\.sql/.exec(trimmed);
    if (match?.[1]) {
      names.push(match[1]);
    }
  }
  return names;
}

describe("M0-B migration push (integration)", () => {
  it.skipIf(!process.env.RUN_DB_PUSH_TESTS)(
    "supabase db push applies B1–B14 on linked remote",
    () => {
      const repoRoot = resolveRepoRoot();
      loadSupabaseEnv(repoRoot);
      const cli = resolveSupabaseCli();

      execFileSync(
        cli.command,
        [...cli.args, "db", "push", "--linked"],
        {
          cwd: repoRoot,
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"],
          env: process.env,
        },
      );

      const listOutput = execFileSync(
        cli.command,
        [...cli.args, "migration", "list", "--linked"],
        {
          cwd: repoRoot,
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"],
        },
      );

      const applied = parseAppliedRemoteMigrationNames(listOutput);
      for (const expected of listExpectedMigrationNames()) {
        expect(applied, `missing remote migration: ${expected}`).toContain(
          expected,
        );
      }
      expect(applied.length).toBeGreaterThanOrEqual(M0_B_MIGRATIONS.length);
    },
    300_000,
  );
});
