import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { resolveSupabaseCli } from "../config/supabase-cli.js";
import { resolveRepoRoot } from "../config/env.js";
import {
  assertMigrationParity,
  compareMigrationParity,
} from "./m0-migration-parity.js";

const SAMPLE_LIST = `
   Local          | Remote         | Time (UTC)
  ----------------|----------------|---------------------
   20260529102025 | 20260529102025 | 2026-05-29 10:20:25
   20260529110002 | 20260529110002 | 2026-05-29 11:00:02
`;

describe("compareMigrationParity", () => {
  it("reports drift when remote is subset of local", () => {
    const report = compareMigrationParity(SAMPLE_LIST, resolveRepoRoot());
    expect(report.missingOnRemote.length).toBeGreaterThan(0);
  });
});

describe("assertMigrationParity (integration)", () => {
  it("local migrations match linked remote list", () => {
    const repoRoot = resolveRepoRoot();
    const cli = resolveSupabaseCli();
    const output = execFileSync(
      cli.command,
      [...cli.args, "migration", "list", "--linked"],
      {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    const report = assertMigrationParity(output, repoRoot);
    expect(report.localTimestamps.length).toBe(14);
    expect(report.localTimestamps).toEqual(report.remoteTimestamps);
  });
});
