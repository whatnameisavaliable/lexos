import {
  createApiError,
  isApiErrorResponse,
  type ApiErrorResponse,
  type ApiResponse,
  type ApiSuccessResponse,
} from "@lexos/shared/api";
import type { ErrorCode } from "@lexos/shared/api";
import { getAccessToken } from "./session";

/** API 客户端可配置项。 */
export interface ApiClientOptions {
  /** 相对 BFF 根路径，默认 `/api`。 */
  readonly baseUrl?: string;
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
    const hint =
      response.status === 404 || response.status === 502 || response.status === 503
        ? "无法连接 BFF/API，请先运行 npm run dev:api（端口 4000）"
        : "服务端返回非 JSON 响应";
    throw new ApiClientError(
      "INTERNAL_ERROR",
      hint,
      undefined,
      response.status,
    );
  }

  if (isApiErrorResponse(payload)) {
    throw new ApiClientError(
      payload.error.code,
      payload.error.message,
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
