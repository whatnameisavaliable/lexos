import { createClient } from "@supabase/supabase-js";

import { getMissingSupabaseEnvKeys, getSupabaseRuntimeEnv } from "@/lib/env";

export function createSupabaseAdminClient() {
  const env = getSupabaseRuntimeEnv();

  if (!env) {
    const missing = getMissingSupabaseEnvKeys().join(", ");
    throw new Error(`缺少 Supabase 服务端环境变量：${missing}`);
  }

  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

