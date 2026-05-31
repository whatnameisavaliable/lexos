import type { APIRequestContext, Page } from "@playwright/test";

/** BFF 登录响应（与 U2 `AuthLoginService` 一致）。 */
export interface E2eLoginResult {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly userId: string;
  readonly role: string;
  readonly requiresPasswordChange: boolean;
}

const ACCESS_TOKEN_COOKIE = "lexos_access_token";
const ACCESS_TOKEN_STORAGE_KEY = "lexos_access_token";
const REFRESH_TOKEN_STORAGE_KEY = "lexos_refresh_token";

/**
 * 经 BFF `POST /api/auth/login` 获取会话（不走 Supabase 客户端）。
 *
 * @param request - Playwright API 上下文
 * @param credentials - 用户名与密码
 * @param apiBase - 可选 API 根（默认走 Web 反代 `/api`）
 */
export async function loginViaBff(
  request: APIRequestContext,
  credentials: { username: string; password: string },
  apiBase = "/api",
): Promise<E2eLoginResult> {
  const response = await request.post(`${apiBase}/auth/login`, {
    data: credentials,
  });
  if (!response.ok()) {
    throw new Error(
      `BFF login failed: HTTP ${response.status()} ${await response.text()}`,
    );
  }
  const body = (await response.json()) as {
    success: boolean;
    data?: E2eLoginResult;
    error?: { message: string };
  };
  if (!body.success || !body.data) {
    throw new Error(body.error?.message ?? "BFF login missing data");
  }
  return body.data;
}

/**
 * 将 BFF 登录结果写入浏览器会话（Cookie + localStorage，与 `session.ts` 对齐）。
 *
 * @param page - Playwright Page
 * @param session - {@link loginViaBff} 返回值
 */
export async function applyBrowserSession(
  page: Page,
  session: E2eLoginResult,
): Promise<void> {
  const encoded = encodeURIComponent(session.accessToken);
  await page.context().addCookies([
    {
      name: ACCESS_TOKEN_COOKIE,
      value: encoded,
      url: page.url().startsWith("http") ? new URL(page.url()).origin : "http://localhost:3000",
      sameSite: "Lax",
    },
  ]);
  await page.addInitScript(
    ({ accessToken, refreshToken, accessKey, refreshKey }) => {
      localStorage.setItem(accessKey, accessToken);
      localStorage.setItem(refreshKey, refreshToken);
    },
    {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      accessKey: ACCESS_TOKEN_STORAGE_KEY,
      refreshKey: REFRESH_TOKEN_STORAGE_KEY,
    },
  );
}

/**
 * admin 账号登录并进入管理区。
 *
 * @param page - Playwright Page
 * @param request - Playwright API 上下文
 * @param password - 口令（默认读 `E2E_ADMIN_PASSWORD` / `AUTH_INITIAL_PASSWORD`）
 */
export async function loginAsAdmin(
  page: Page,
  request: APIRequestContext,
  password = process.env.E2E_ADMIN_PASSWORD ??
    process.env.AUTH_INITIAL_PASSWORD ??
    "",
): Promise<E2eLoginResult> {
  const session = await loginViaBff(request, {
    username: process.env.E2E_ADMIN_USERNAME ?? "admin",
    password,
  });
  await page.goto("/login");
  await applyBrowserSession(page, session);
  await page.goto(session.requiresPasswordChange ? "/change-password" : "/admin");
  return session;
}

/**
 * lawyer 账号登录并进入业务区。
 *
 * @param page - Playwright Page
 * @param request - Playwright API 上下文
 * @param username - 律师用户名
 * @param password - 口令
 */
export async function loginAsLawyer(
  page: Page,
  request: APIRequestContext,
  username: string,
  password: string,
): Promise<E2eLoginResult> {
  const session = await loginViaBff(request, { username, password });
  await page.goto("/login");
  await applyBrowserSession(page, session);
  await page.goto(
    session.requiresPasswordChange ? "/change-password" : "/lawyer",
  );
  return session;
}

/**
 * 探测 E2E 目标 Web/API 是否可达；不可达时跳过场景。
 *
 * @param request - Playwright API 上下文
 */
export async function isE2eEnvironmentReady(
  request: APIRequestContext,
): Promise<boolean> {
  try {
    const health = await request.get("/api/../health".replace("/api/../", "/"));
    // Web 不暴露 /health；尝试 web root
    if (health.ok()) {
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const root = await request.get("/");
    return root.status() < 500;
  } catch {
    return false;
  }
}
