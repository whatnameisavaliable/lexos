import type { ErrorCode } from "./error-code.js";

/** 失败响应中的 `error` 对象（`architecture.md` §6.1）。 */
export interface ApiErrorBody {
  readonly code: ErrorCode;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
  readonly requestId: string;
}

/** 统一失败响应体。 */
export interface ApiErrorResponse {
  readonly success: false;
  readonly error: ApiErrorBody;
}

/** 成功响应可选元数据（分页 cursor 等）。 */
export interface ApiResponseMeta {
  readonly requestId?: string;
  readonly cursor?: string;
}

/** 统一成功响应体（`architecture.md` §6.1）。 */
export interface ApiSuccessResponse<T> {
  readonly success: true;
  readonly data: T;
  readonly meta?: ApiResponseMeta;
}

/** 成功或失败联合类型。 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * 构造成功响应（不含敏感字段）。
 */
export function createApiSuccess<T>(
  data: T,
  meta?: ApiResponseMeta,
): ApiSuccessResponse<T> {
  return meta ? { success: true, data, meta } : { success: true, data };
}

/**
 * 构造失败响应。
 */
export function createApiError(
  error: ApiErrorBody,
): ApiErrorResponse {
  return { success: false, error };
}

/**
 * 类型守卫：是否为失败响应。
 */
export function isApiErrorResponse(
  response: ApiResponse<unknown>,
): response is ApiErrorResponse {
  return response.success === false;
}
