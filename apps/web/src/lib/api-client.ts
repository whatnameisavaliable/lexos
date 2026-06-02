import {
  createApiError,
  isApiErrorResponse,
  type ApiErrorResponse,
  type ApiResponse,
  type ApiSuccessResponse,
} from "@lexos/shared/api";
import type { ErrorCode } from "@lexos/shared/api";
import { AUTH_LOGIN_FAILURE_MESSAGE } from "@lexos/shared";
import { clearAccessToken, getAccessToken } from "./session";
import { refreshSession } from "./refresh-session";
import { buildClientAuditHeaders } from "./client-audit-headers";

/** API 客户端可配置项。 */
export interface ApiClientOptions {
  /** 相对 BFF 根路径，默认 `/api`。 */
  readonly baseUrl?: string;
  /** 内部：401 后已尝试 refresh，避免无限重试。 */
  readonly retriedAuth?: boolean;
}

/** 业务 API 失败（含 `error.code`）。 */
export class ApiClientError extends Error {
  constructor(
    readonly code: ErrorCode | string,
    message: string,
    readonly requestId?: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

const USER_FACING_ERROR_MESSAGES: Partial<Record<string, string>> = {
  AUTH_UNAUTHORIZED: "登录已过期或无效，请重新登录后再试",
  AUTH_INVALID_CREDENTIALS: AUTH_LOGIN_FAILURE_MESSAGE,
  AUTH_ACCOUNT_DISABLED: AUTH_LOGIN_FAILURE_MESSAGE,
  AUTH_PASSWORD_CHANGE_REQUIRED: "请先修改密码后再继续操作",
};

function localizeErrorMessage(code: string, message: string): string {
  return USER_FACING_ERROR_MESSAGES[code] ?? message;
}

/**
 * 统一 `fetch` 封装：`credentials: include`、Bearer、解析 `ApiResponse`。
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  options: ApiClientOptions = {},
): Promise<ApiSuccessResponse<T>> {
  const base = options.baseUrl ?? "/api";
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = new Headers(init.headers);
  if (!headers.has("content-type") && init.body) {
    headers.set("content-type", "application/json");
  }

  for (const [key, value] of Object.entries(buildClientAuditHeaders())) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }

  const token = getAccessToken();
  if (token && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });

  const rawText = await response.text();
  let payload: ApiResponse<T>;
  try {
    payload = (rawText ? JSON.parse(rawText) : {}) as ApiResponse<T>;
  } catch {
    const trimmed = rawText.trimStart();
    const isHtml =
      trimmed.startsWith("<!DOCTYPE") ||
      trimmed.startsWith("<html") ||
      trimmed.startsWith("<HTML");
    const hint = isHtml
      ? "API 返回了 HTML 页面（可能未启动或已崩溃），请在新终端执行 npm run dev:api:restart 后重试"
      : response.status === 404 || response.status === 502 || response.status === 503
        ? "无法连接 BFF/API，请先运行 npm run dev:api（端口 4000）"
        : trimmed.length > 0
          ? `服务端返回非 JSON 响应（HTTP ${response.status}）`
          : "服务端返回非 JSON 响应";
    throw new ApiClientError(
      "INTERNAL_ERROR",
      hint,
      undefined,
      response.status,
    );
  }

  if (isApiErrorResponse(payload)) {
    if (
      payload.error.code === "AUTH_UNAUTHORIZED" &&
      !options.retriedAuth &&
      !path.includes("/auth/login") &&
      !path.includes("/auth/refresh")
    ) {
      try {
        await refreshSession();
        return apiFetch<T>(path, init, { ...options, retriedAuth: true });
      } catch {
        clearAccessToken();
      }
    }

    throw new ApiClientError(
      payload.error.code,
      localizeErrorMessage(payload.error.code, payload.error.message),
      payload.error.requestId,
      response.status,
    );
  }

  if (!response.ok) {
    throw new ApiClientError(
      "INTERNAL_ERROR",
      `HTTP ${response.status}`,
      payload.meta?.requestId,
      response.status,
    );
  }

  return payload;
}

/**
 * 类型守卫辅助：将未知错误转为 {@link ApiClientError}。
 */
export function toApiClientError(err: unknown): ApiClientError {
  if (err instanceof ApiClientError) {
    return err;
  }
  if (err instanceof Error) {
    return new ApiClientError("INTERNAL_ERROR", err.message);
  }
  return new ApiClientError("INTERNAL_ERROR", "Unknown error");
}

/** 构造失败响应（测试用）。 */
export function mockApiError(
  code: ErrorCode,
  message: string,
  requestId = "test-req",
): ApiErrorResponse {
  return createApiError({ code, message, requestId });
}
