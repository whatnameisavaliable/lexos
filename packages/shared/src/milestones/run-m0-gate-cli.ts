/**
 * M0-E 门禁：校验子任务勾选与迁移列表一致性。
 * 用法：`npm run verify:m0-gate`
 */
import { execFileSync } from "node:child_process";
import { resolveSupabaseCli } from "../config/supabase-cli.js";
import { resolveRepoRoot } from "../config/env.js";
import { assertMigrationParity } from "./m0-migration-parity.js";
import { assertM0SubtasksComplete } from "./m0-subtasks.js";

function main(): void {
  const repoRoot = resolveRepoRoot();

  assertM0SubtasksComplete(repoRoot);

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

  const parity = assertMigrationParity(listOutput, repoRoot);

  console.log(
    JSON.stringify({
      ok: true,
      milestone: "M0",
      migrationCount: parity.localTimestamps.length,
      subtasks: "M0-A..M0-D complete",
    }),
  );
}

main();
