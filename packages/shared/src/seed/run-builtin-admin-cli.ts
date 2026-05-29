/**
 * CLI：通过 Supabase Auth Admin API 幂等创建内置 `admin` 用户。
 * 用法（仓库根目录）：`npm run seed:admin`
 * 依赖环境变量：`SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`AUTH_VIRTUAL_EMAIL_DOMAIN`、`AUTH_INITIAL_PASSWORD`
 */
import { createClient } from "@supabase/supabase-js";
import { loadAuthSeedEnvFromProcess } from "../config/auth-env.js";
import {
  loadEnvFiles,
  loadSupabaseEnvFromProcess,
  resolveRepoRoot,
} from "../config/env.js";
import { seedBuiltinAdmin } from "./builtin-admin.js";

async function main(): Promise<void> {
  const repoRoot = resolveRepoRoot();
  const presetInitialPassword = process.env.AUTH_INITIAL_PASSWORD;
  loadEnvFiles(repoRoot, [".env", ".env.development"]);
  if (
    presetInitialPassword?.trim() &&
    !process.env.AUTH_INITIAL_PASSWORD?.trim()
  ) {
    process.env.AUTH_INITIAL_PASSWORD = presetInitialPassword;
  }
  const supabaseEnv = loadSupabaseEnvFromProcess();
  const authEnv = loadAuthSeedEnvFromProcess();

  const client = createClient(
    supabaseEnv.supabaseUrl,
    supabaseEnv.supabaseServiceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const result = await seedBuiltinAdmin(client, authEnv);
  console.log(
    JSON.stringify({
      ok: true,
      userId: result.userId,
      virtualEmail: result.virtualEmail,
      createdAuthUser: result.createdAuthUser,
      upsertedProfile: result.upsertedProfile,
    }),
  );
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
