import type { SupabaseClient } from "@supabase/supabase-js";
import {
  BUILTIN_ADMIN_USERNAME,
  resolveVirtualEmail,
  type AuthSeedEnvConfig,
} from "../config/auth-env.js";

/** 内置管理员 `profiles` 行写入载荷。 */
export interface BuiltinAdminProfileInput {
  readonly id: string;
  readonly username: typeof BUILTIN_ADMIN_USERNAME;
  readonly displayName: string;
  readonly requiresPasswordChange: boolean;
}

/** 种子执行结果。 */
export interface BuiltinAdminSeedResult {
  readonly userId: string;
  readonly virtualEmail: string;
  readonly createdAuthUser: boolean;
  readonly upsertedProfile: boolean;
}

const DEFAULT_DISPLAY_NAME = "系统管理员";

/**
 * 根据 Auth 种子配置解析内置管理员虚拟邮箱。
 */
export function getBuiltinAdminVirtualEmail(
  config: Pick<AuthSeedEnvConfig, "authVirtualEmailDomain" | "builtinAdminUsername">,
): string {
  return resolveVirtualEmail(
    config.builtinAdminUsername,
    config.authVirtualEmailDomain,
  );
}

/**
 * 构建内置管理员 `profiles` 行（PRD §1.4 A3：`requires_password_change=true`）。
 */
export function buildBuiltinAdminProfile(
  userId: string,
  requiresPasswordChange = true,
): BuiltinAdminProfileInput {
  return {
    id: userId,
    username: BUILTIN_ADMIN_USERNAME,
    displayName: DEFAULT_DISPLAY_NAME,
    requiresPasswordChange,
  };
}

/**
 * 通过 Admin API 查找虚拟邮箱对应用户 ID。
 */
export async function findAuthUserIdByEmail(
  client: SupabaseClient,
  email: string,
): Promise<string | null> {
  const { data, error } = await client.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) {
    throw new Error(`auth.admin.listUsers failed: ${error.message}`);
  }
  const match = data.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  return match?.id ?? null;
}

/**
 * 幂等创建/同步内置 `admin`：Auth 用户 + `profiles`（`role=admin`，首次强制改密）。
 */
export async function seedBuiltinAdmin(
  client: SupabaseClient,
  config: AuthSeedEnvConfig,
): Promise<BuiltinAdminSeedResult> {
  const virtualEmail = getBuiltinAdminVirtualEmail(config);
  let userId = await findAuthUserIdByEmail(client, virtualEmail);
  let createdAuthUser = false;

  if (!userId) {
    const { data, error } = await client.auth.admin.createUser({
      email: virtualEmail,
      password: config.authInitialPassword,
      email_confirm: true,
      user_metadata: { username: config.builtinAdminUsername },
    });
    if (error) {
      throw new Error(`auth.admin.createUser failed: ${error.message}`);
    }
    userId = data.user.id;
    createdAuthUser = true;
  }

  const profile = buildBuiltinAdminProfile(userId, true);
  const { error: profileError } = await client.from("profiles").upsert(
    {
      id: profile.id,
      username: profile.username,
      display_name: profile.displayName,
      role: "admin",
      status: "enabled",
      requires_password_change: profile.requiresPasswordChange,
      mfa_enabled: false,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw new Error(`profiles upsert failed: ${profileError.message}`);
  }

  return {
    userId,
    virtualEmail,
    createdAuthUser,
    upsertedProfile: true,
  };
}

/**
 * 断言 `profiles` 中存在唯一内置 `admin` 行（M0-C 验收）。
 */
export async function assertBuiltinAdminProfileExists(
  client: SupabaseClient,
): Promise<BuiltinAdminProfileInput> {
  const { data, error } = await client
    .from("profiles")
    .select(
      "id, username, display_name, role, requires_password_change, status",
    )
    .eq("username", BUILTIN_ADMIN_USERNAME)
    .maybeSingle();

  if (error) {
    throw new Error(`profiles select failed: ${error.message}`);
  }
  if (!data) {
    throw new Error(`Builtin admin profile "${BUILTIN_ADMIN_USERNAME}" not found`);
  }
  if (data.role !== "admin") {
    throw new Error(`Builtin admin profile has unexpected role: ${data.role}`);
  }
  if (data.status !== "enabled") {
    throw new Error(`Builtin admin profile is not enabled: ${data.status}`);
  }

  return {
    id: data.id,
    username: BUILTIN_ADMIN_USERNAME,
    displayName: data.display_name,
    requiresPasswordChange: data.requires_password_change,
  };
}
