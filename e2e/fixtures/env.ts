import type { APIRequestContext } from "@playwright/test";

/**
 * E2E 环境变量与就绪探测。
 */
export function getE2ePassword(): string {
  return (
    process.env.E2E_PASSWORD ??
    process.env.AUTH_INITIAL_PASSWORD ??
    ""
  );
}

/**
 * @returns 无口令时 E2E 应跳过
 */
export function hasE2eCredentials(): boolean {
  return getE2ePassword().length > 0;
}

/**
 * 探测 Web 应用是否在线。
 *
 * @param request - Playwright API 上下文
 */
export async function isWebReady(request: APIRequestContext): Promise<boolean> {
  try {
    const res = await request.get("/login");
    return res.status() < 500;
  } catch {
    return false;
  }
}

/**
 * 探测 U2 API 健康（经 Web 反代或 `E2E_API_URL` 直连）。
 *
 * @param request - Playwright API 上下文
 */
export async function isApiHealthy(
  request: APIRequestContext,
): Promise<boolean> {
  const apiUrl =
    process.env.E2E_API_URL ?? process.env.API_URL ?? "http://localhost:4000";
  try {
    const res = await request.get(`${apiUrl.replace(/\/$/, "")}/health`);
    if (!res.ok()) {
      return false;
    }
    const body = (await res.json()) as {
      data?: { status?: string };
    };
    return body.data?.status === "ok";
  } catch {
    return false;
  }
}
