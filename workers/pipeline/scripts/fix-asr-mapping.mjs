/**
 * 将 asr_physical 映射到 DashScope fun-asr 模型（修复 DeepSeek 404）。
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
config({ path: path.join(repoRoot, ".env.development"), override: true });

const FUN_ASR_MODEL_ID = "804d94a0-c1e2-48bb-8263-7349ffb75f0d";

const admin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const { error } = await admin
  .from("ai_feature_model_mappings")
  .update({
    primary_model_id: FUN_ASR_MODEL_ID,
    fallback_model_id: FUN_ASR_MODEL_ID,
  })
  .eq("feature_key", "asr_physical");

if (error) {
  throw new Error(error.message);
}

console.log("Updated asr_physical -> fun-asr-mtl (DashScope)");
