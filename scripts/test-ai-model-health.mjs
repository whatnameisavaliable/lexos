/**
 * 直接调用 Gemini 模型连通性测试（开发调试）。
 */
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadAiRuntimeEnvFromProcess,
  loadSupabaseEnvFromProcess,
} from "@lexos/shared/config";
import { AiAdapterFactory } from "../apps/api/src/adapters/ai/ai-adapter.factory.js";
import { toModelCredentials } from "../apps/api/src/adapters/ai/model-credentials.mapper.js";
import { createAiCredentialCrypto } from "../apps/api/src/lib/ai-credential-crypto.js";
import { createClient } from "@supabase/supabase-js";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
config({ path: path.join(repoRoot, ".env.development"), override: true });

const modelUuid = process.argv[2] ?? "2d9ac648-f9ac-40b7-8869-429bdbaaf6cd";
const supabaseEnv = loadSupabaseEnvFromProcess();
const aiEnv = loadAiRuntimeEnvFromProcess();
const crypto = createAiCredentialCrypto(aiEnv);
const admin = createClient(
  supabaseEnv.supabaseUrl,
  supabaseEnv.supabaseServiceRoleKey,
  { auth: { persistSession: false } },
);

const { data: row, error } = await admin
  .from("ai_model_credentials")
  .select(
    "id, provider_kind, model_id, model_name, base_url, api_key_ciphertext, is_enabled",
  )
  .eq("id", modelUuid)
  .maybeSingle();

if (error || !row) {
  throw new Error(error?.message ?? "model not found");
}

console.log("model:", {
  id: row.id,
  name: row.model_name,
  base_url: row.base_url,
  provider_kind: row.provider_kind,
});

const apiKey = crypto.decrypt(row.api_key_ciphertext);
const credentials = toModelCredentials(
  {
    provider_kind: row.provider_kind,
    model_id: row.model_id,
    model_name: row.model_name,
    base_url: row.base_url,
  },
  apiKey,
);

const adapter = new AiAdapterFactory().get(row.provider_kind);
const result = await adapter.healthCheck(credentials, {
  timeoutMs: aiEnv.aiTestTimeoutMs,
});
console.log("healthcheck:", result);
