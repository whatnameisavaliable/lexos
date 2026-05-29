import type { SupabaseEnvConfig } from "./env.js";

/** 远端 Supabase REST 连通性探测结果。 */
export interface SupabaseConnectivityResult {
  readonly ok: boolean;
  readonly status: number;
  readonly url: string;
}

/**
 * 通过 Supabase Auth 健康检查端点探测远端项目是否可达（无需有效 JWT）。
 * @param config - 自环境变量加载的 Supabase 配置（仅使用 `supabaseUrl`）
 */
export async function probeSupabaseRest(
  config: Pick<SupabaseEnvConfig, "supabaseUrl" | "supabaseAnonKey">,
): Promise<SupabaseConnectivityResult> {
  const base = config.supabaseUrl.replace(/\/$/, "");
  const url = `${base}/auth/v1/health`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: config.supabaseAnonKey,
    },
  });

  return {
    ok: response.ok,
    status: response.status,
    url,
  };
}

/**
 * 断言 Supabase REST 可达；失败时抛出含 HTTP 状态的错误。
 */
export async function assertSupabaseReachable(
  config: Pick<SupabaseEnvConfig, "supabaseUrl" | "supabaseAnonKey">,
): Promise<SupabaseConnectivityResult> {
  const result = await probeSupabaseRest(config);
  if (!result.ok) {
    throw new Error(
      `Supabase REST unreachable: ${result.url} returned HTTP ${result.status}`,
    );
  }
  return result;
}
