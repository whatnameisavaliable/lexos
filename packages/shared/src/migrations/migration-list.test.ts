import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { resolveRepoRoot } from "../config/env.js";
import { resolveSupabaseCli } from "../config/supabase-cli.js";
import {
  listLocalMigrationTimestamps,
  parseSyncedMigrationTimestamps,
} from "./migration-cli-parse.js";
import { listExpectedMigrationNames } from "./manifest.js";

describe("M0-B B15 migration list (integration)", () => {
  it("remote database has all B1–B14 migrations applied", () => {
    const repoRoot = resolveRepoRoot();
    const cli = resolveSupabaseCli();

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

    expect(synced.length).toBe(localTimestamps.length);
    expect(synced).toEqual(localTimestamps);
    expect(listExpectedMigrationNames().length).toBe(14);
  });
});
