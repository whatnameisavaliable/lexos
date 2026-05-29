import { loadSupabaseEnv, resolveRepoRoot } from "../config/index.js";
import { applyPendingMigrations } from "./pg-migrate.js";

/**
 * CLI：`npx tsx packages/shared/src/db/apply-migrations-cli.ts`
 * Windows 上替代 `npx supabase db push --linked`（仅需 `SUPABASE_DB_URL`）。
 */
async function main(): Promise<void> {
  const repoRoot = resolveRepoRoot();
  const env = loadSupabaseEnv(repoRoot);
  const result = await applyPendingMigrations(env.supabaseDbUrl, repoRoot);

  if (result.applied.length === 0) {
    console.log("No pending migrations.");
  } else {
    console.log("Applied migrations:");
    for (const version of result.applied) {
      console.log(`  + ${version}`);
    }
  }

  if (result.skipped.length > 0) {
    console.log(`Skipped ${result.skipped.length} already applied.`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
