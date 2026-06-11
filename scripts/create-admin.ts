import { createClient } from "@supabase/supabase-js";

import { getSupabaseRuntimeEnv } from "../src/lib/env.ts";
import { validateCreateUserInput } from "../src/lib/auth/user-provisioning.ts";

const env = getSupabaseRuntimeEnv();

if (!env) {
  throw new Error("缺少 Supabase 环境变量。请先配置 .env.local。");
}

const username = process.env.LEXOS_ADMIN_USERNAME ?? "admin";
const displayName = process.env.LEXOS_ADMIN_DISPLAY_NAME ?? "系统管理员";
const admin = createClient(env.url, env.serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const input = validateCreateUserInput({
  username,
  displayName,
  roleCode: "system_admin",
  authEmailDomain: env.authEmailDomain,
});

const { data: existingProfile, error: existingProfileError } = await admin
  .from("profiles")
  .select("id, username")
  .eq("username", input.username)
  .maybeSingle();

if (existingProfileError) {
  throw existingProfileError;
}

if (existingProfile) {
  console.log(`管理员 ${input.username} 已存在，跳过创建。`);
  process.exit(0);
}

const { data: authUser, error: authError } = await admin.auth.admin.createUser({
  email: input.authEmail,
  password: input.defaultPassword,
  email_confirm: true,
  user_metadata: {
    username: input.username,
    display_name: input.displayName,
  },
});

if (authError || !authUser.user) {
  throw authError ?? new Error("创建 Supabase Auth 管理员失败");
}

const { error: profileError } = await admin.from("profiles").insert({
  id: authUser.user.id,
  username: input.username,
  display_name: input.displayName,
  auth_email: input.authEmail,
  status: "active",
  must_change_password: true,
});

if (profileError) {
  await admin.auth.admin.deleteUser(authUser.user.id);
  throw profileError;
}

const { error: memberError } = await admin.from("organization_members").upsert(
  {
    organization_id: env.defaultOrganizationId,
    user_id: authUser.user.id,
    role_code: "system_admin",
    status: "active",
  },
  { onConflict: "organization_id,user_id,role_code" },
);

if (memberError) {
  await admin.auth.admin.deleteUser(authUser.user.id);
  throw memberError;
}

console.log(`管理员创建完成：${input.username} / ${input.defaultPassword}`);
console.log("首次登录后系统会要求修改默认密码。");

