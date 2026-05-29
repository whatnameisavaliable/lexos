import { config } from "dotenv";
import fs from "node:fs";
import path from "node:path";

/** 支持加载的环境文件名（按优先级从低到高叠加）。 */
export const ENV_FILE_NAMES = [
  ".env",
  ".env.development",
  ".env.production",
] as const;

export type EnvFileName = (typeof ENV_FILE_NAMES)[number];

/** Supabase 相关环境变量（M0 连通性校验子集）。 */
export interface SupabaseEnvConfig {
  readonly supabaseUrl: string;
  readonly supabaseAnonKey: string;
  readonly supabaseServiceRoleKey: string;
  readonly supabaseJwtSecret: string;
  readonly supabaseDbUrl: string;
}

/** 从 `process.env` 解析的 LexOS 应用环境配置（首期 M0 子集，后续里程碑扩展）。 */
export interface AppEnvConfig extends SupabaseEnvConfig {
  readonly nodeEnv: string;
  readonly appUrl: string;
  readonly apiUrl: string;
}

/**
 * 解析仓库根目录：自当前工作目录向上查找含 `package.json` 且 workspaces 含 lexos 的目录。
 */
export function resolveRepoRoot(startDir: string = process.cwd()): string {
  let current = path.resolve(startDir);
  const root = path.parse(current).root;

  while (true) {
    const pkgPath = path.join(current, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const raw = fs.readFileSync(pkgPath, "utf8");
        const pkg = JSON.parse(raw) as { name?: string; workspaces?: unknown };
        if (pkg.name === "lexos" || Array.isArray(pkg.workspaces)) {
          return current;
        }
      } catch {
        /* 继续向上 */
      }
    }
    if (current === root) {
      return path.resolve(startDir);
    }
    current = path.dirname(current);
  }
}

/**
 * 按顺序加载环境文件（后加载覆盖先加载）。
 * @param repoRoot - 仓库根目录
 * @param files - 要加载的文件名列表
 */
export function loadEnvFiles(
  repoRoot: string,
  files: readonly EnvFileName[] = [".env.development", ".env"],
): void {
  for (const file of files) {
    const fullPath = path.join(repoRoot, file);
    if (fs.existsSync(fullPath)) {
      config({ path: fullPath, override: true });
    }
  }
}

/**
 * 读取必填环境变量；缺失时抛出明确错误（禁止在业务代码中硬编码默认值）。
 */
export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * 解析 Supabase 连接相关配置。
 */
export function loadSupabaseEnvFromProcess(): SupabaseEnvConfig {
  return {
    supabaseUrl: requireEnv("SUPABASE_URL"),
    supabaseAnonKey: requireEnv("SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    supabaseJwtSecret: requireEnv("SUPABASE_JWT_SECRET"),
    supabaseDbUrl: requireEnv("SUPABASE_DB_URL"),
  };
}

/**
 * 从仓库根目录加载 `.env.development` 并返回 Supabase 配置。
 */
export function loadSupabaseEnv(
  repoRoot: string = resolveRepoRoot(),
): SupabaseEnvConfig {
  loadEnvFiles(repoRoot, [".env", ".env.development"]);
  return loadSupabaseEnvFromProcess();
}
