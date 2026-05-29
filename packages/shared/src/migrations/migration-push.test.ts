import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { loadSupabaseEnv, resolveRepoRoot } from "../config/env.js";
import { resolveSupabaseCli } from "../config/supabase-cli.js";
import {
  listLocalMigrationTimestamps,
  parseSyncedMigrationTimestamps,
} from "./migration-cli-parse.js";
import { listExpectedMigrationNames } from "./manifest.js";

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

      const synced = parseSyncedMigrationTimestamps(listOutput);
      const localTimestamps = listLocalMigrationTimestamps(repoRoot);

      expect(synced).toEqual(localTimestamps);
      expect(listExpectedMigrationNames().length).toBe(14);
    },
    300_000,
  );
});
