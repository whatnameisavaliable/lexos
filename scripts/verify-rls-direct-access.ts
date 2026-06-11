import { createClient } from "@supabase/supabase-js";

import { buildAuthEmailForUsername } from "../src/lib/auth/user-provisioning.ts";
import { getSupabaseRuntimeEnv } from "../src/lib/env.ts";

type CheckResult = {
  table: string;
  ok: boolean;
  detail: string;
};

const internalTables = [
  "organizations",
  "profiles",
  "roles",
  "ranks",
  "organization_members",
  "customers",
  "matters",
  "tasks",
  "task_claims",
  "task_milestones",
  "task_deliverables",
  "customer_portal_links",
  "customer_verification_codes",
  "customer_feedback",
  "settlements",
  "fund_transactions",
  "risk_cases",
  "audit_logs",
  "system_settings",
];

const env = getSupabaseRuntimeEnv();

if (!env) {
  throw new Error("缺少 Supabase 环境变量，请先配置 .env.local");
}

const testUsername = process.env.LEXOS_RLS_TEST_USERNAME ?? "lawyer01";
const testPassword = process.env.LEXOS_RLS_TEST_PASSWORD ?? process.env.LEXOS_SMOKE_TEST_PASSWORD;

if (!testPassword) {
  throw new Error("缺少 LEXOS_RLS_TEST_PASSWORD 或 LEXOS_SMOKE_TEST_PASSWORD");
}

const admin = createClient(env.url, env.serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
const anon = createClient(env.url, env.anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
const authenticated = createClient(env.url, env.anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { error: signInError } = await authenticated.auth.signInWithPassword({
  email: buildAuthEmailForUsername(testUsername, env.authEmailDomain),
  password: testPassword,
});

if (signInError) {
  throw new Error(`RLS 测试用户登录失败：${signInError.message}`);
}

const serviceRoleResults = await Promise.all(internalTables.map((table) => expectServiceRoleReadable(table)));
const anonResults = await Promise.all(internalTables.map((table) => expectDirectAccessBlocked("anon", table, anon)));
const authenticatedResults = await Promise.all(
  internalTables.map((table) => expectDirectAccessBlocked("authenticated", table, authenticated)),
);
const failures = [...serviceRoleResults, ...anonResults, ...authenticatedResults].filter((item) => !item.ok);

console.log(
  JSON.stringify(
    {
      ok: failures.length === 0,
      checkedTables: internalTables.length,
      serviceRoleReadable: serviceRoleResults.filter((item) => item.ok).length,
      anonBlocked: anonResults.filter((item) => item.ok).length,
      authenticatedBlocked: authenticatedResults.filter((item) => item.ok).length,
      failures,
      note: "期望浏览器角色无法直接访问内部表；业务访问统一经过 Next.js API + service role。",
    },
    null,
    2,
  ),
);

if (failures.length) {
  process.exitCode = 1;
}

async function expectServiceRoleReadable(table: string): Promise<CheckResult> {
  const { error } = await admin.from(table).select("*").limit(1);

  return {
    table,
    ok: !error,
    detail: error ? `service_role 无法读取：${error.message}` : "service_role 可读取",
  };
}

async function expectDirectAccessBlocked(
  role: "anon" | "authenticated",
  table: string,
  client: typeof anon,
): Promise<CheckResult> {
  const { error } = await client.from(table).select("*").limit(1);

  return {
    table,
    ok: Boolean(error),
    detail: error ? `${role} 已被拒绝：${error.message}` : `${role} 仍可直接访问 Data API`,
  };
}

export {};
