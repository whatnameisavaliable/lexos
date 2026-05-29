import { loadEnvFiles, requireEnv, resolveRepoRoot } from "./env.js";

/** 内置管理员用户名（PRD §1.4 / §2.1，固定标识）。 */
export const BUILTIN_ADMIN_USERNAME = "admin" as const;

/** 认证与种子脚本相关环境变量。 */
export interface AuthSeedEnvConfig {
  readonly authVirtualEmailDomain: string;
  readonly authInitialPassword: string;
  readonly builtinAdminUsername: typeof BUILTIN_ADMIN_USERNAME;
}

/**
 * 将登录用户名解析为 Supabase Auth 虚拟邮箱（PRD §2.5.1）。
 * @param username - 小写规范化用户名
 * @param domain - `AUTH_VIRTUAL_EMAIL_DOMAIN`
 */
export function resolveVirtualEmail(username: string, domain: string): string {
  const normalized = username.trim().toLowerCase();
  const host = domain.trim().toLowerCase();
  if (!normalized || !host) {
    throw new Error("username and AUTH_VIRTUAL_EMAIL_DOMAIN must be non-empty");
  }
  return `${normalized}@${host}`;
}

/**
 * 从环境变量加载种子/Auth Admin 所需配置（禁止在代码中硬编码密码）。
 */
export function loadAuthSeedEnvFromProcess(): AuthSeedEnvConfig {
  return {
    authVirtualEmailDomain: requireEnv("AUTH_VIRTUAL_EMAIL_DOMAIN"),
    authInitialPassword: requireEnv("AUTH_INITIAL_PASSWORD"),
    builtinAdminUsername: BUILTIN_ADMIN_USERNAME,
  };
}

/**
 * 从仓库根目录加载 `.env.development` 并返回 Auth 种子配置。
 */
export function loadAuthSeedEnv(
  repoRoot: string = resolveRepoRoot(),
): AuthSeedEnvConfig {
  loadEnvFiles(repoRoot, [".env", ".env.development"]);
  return loadAuthSeedEnvFromProcess();
}
