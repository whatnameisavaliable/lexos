import path from "node:path";
import { loadSupabaseEnv, resolveRepoRoot } from "../config/index.js";
import { runSqlFile } from "./run-sql-file.js";

/**
 * CLI：`npx tsx packages/shared/src/db/run-sql-file-cli.ts <相对仓库根的 sql 路径>`
 */
async function main(): Promise<void> {
  const relativePath = process.argv[2];
  if (!relativePath) {
    console.error(
      "Usage: npx tsx packages/shared/src/db/run-sql-file-cli.ts <path/to/file.sql>",
    );
    process.exit(1);
  }

  const repoRoot = resolveRepoRoot();
  const env = loadSupabaseEnv(repoRoot);
  const filePath = path.resolve(repoRoot, relativePath);

  await runSqlFile(env.supabaseDbUrl, filePath);
  console.log(`OK: executed ${relativePath}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
