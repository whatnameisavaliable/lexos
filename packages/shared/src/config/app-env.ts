import {
  loadEnvFiles,
  loadSupabaseEnvFromProcess,
  requireEnv,
  resolveRepoRoot,
  type SupabaseEnvConfig,
} from "./env.js";

/** 应用运行时环境配置（U2 API / Worker 共用子集）。 */
export interface AppRuntimeEnvConfig extends SupabaseEnvConfig {
  readonly nodeEnv: string;
  readonly appUrl: string;
  readonly apiUrl: string;
  readonly redisUrl: string;
  readonly requestIdHeader: string;
}

/**
 * 从 `API_URL` 解析监听端口（未显式端口时按协议默认）。
 */
export function parseApiListenPort(apiUrl: string): number {
  const url = new URL(apiUrl);
  if (url.port) {
    return Number.parseInt(url.port, 10);
  }
  return url.protocol === "https:" ? 443 : 80;
}

/**
 * 加载 API 进程所需环境变量（含 Supabase 与 Redis）。
 */
export function loadAppRuntimeEnvFromProcess(): AppRuntimeEnvConfig {
  return {
    ...loadSupabaseEnvFromProcess(),
    nodeEnv: requireEnv("NODE_ENV"),
    appUrl: requireEnv("APP_URL"),
    apiUrl: requireEnv("API_URL"),
    redisUrl: requireEnv("REDIS_URL"),
    requestIdHeader:
      process.env.REQUEST_ID_HEADER?.trim() || "x-request-id",
  };
}

/**
 * 从仓库根目录加载 `.env.development` 等并返回应用运行时配置。
 */
export function loadAppRuntimeEnv(
  repoRoot: string = resolveRepoRoot(),
): AppRuntimeEnvConfig {
  loadEnvFiles(repoRoot, [".env", ".env.development"]);
  return loadAppRuntimeEnvFromProcess();
}
