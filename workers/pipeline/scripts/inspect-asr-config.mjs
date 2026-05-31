/** 查看 ASR 模型配置（开发调试）。 */
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
config({ path: path.join(repoRoot, ".env.development"), override: true });

const admin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const { data: mapping } = await admin
  .from("ai_feature_model_mappings")
  .select("feature_key, primary_model_id, fallback_model_id")
  .eq("feature_key", "asr_physical")
  .maybeSingle();

console.log("mapping", mapping);

if (mapping?.primary_model_id) {
  const { data: model } = await admin
    .from("ai_models")
    .select("id, provider_kind, model_name, base_url, is_enabled")
    .eq("id", mapping.primary_model_id)
    .maybeSingle();
  console.log("model", model);
}

const pool = new pg.Pool({
  connectionString: process.env.WORKER_DB_URL,
  ssl: { rejectUnauthorized: false },
});
const logs = await pool.query(
  `SELECT feature_key, model_id, outcome, error_code, latency_ms, created_at
   FROM public.ai_invocation_logs
   WHERE task_id = 'b9497dcd-dcee-4405-b2ef-b50bbb553891'::uuid
   ORDER BY created_at DESC
   LIMIT 5`,
);
console.log("invocation logs", logs.rows);
await pool.end();
