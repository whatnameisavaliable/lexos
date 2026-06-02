/**
 * CLI：为四 SOP 功能点插入 ai_feature_model_mappings（需默认 fallback 模型）。
 * 用法：`npx tsx packages/shared/src/seed/run-sop-ai-mappings-seed-cli.ts`
 */
import {
  loadLexosRuntimeEnvFiles,
  loadSupabaseEnvFromProcess,
  resolveRepoRoot,
} from "../config/env.js";
import { runSopAiMappingsSeed } from "./sop-ai-mappings-seed.js";

async function main(): Promise<void> {
  loadLexosRuntimeEnvFiles(resolveRepoRoot());
  const env = loadSupabaseEnvFromProcess();

  const result = await runSopAiMappingsSeed(env.supabaseDbUrl);
  console.log(JSON.stringify({ ok: true, ...result }));
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
