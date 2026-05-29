import {
  ERROR_CODE_HTTP_STATUS,
  ErrorCode,
  type ErrorCode as ErrorCodeType,
} from "../api/error-code.js";

/**
 * 认证与会话相关错误码子集（`architecture.md` §6.2）。
 * 完整枚举见 {@link ErrorCode}；本模块供 Auth 中间件与 Service 显式引用。
 */
export const AuthErrorCode = {
  AUTH_UNAUTHORIZED: ErrorCode.AUTH_UNAUTHORIZED,
  AUTH_FORBIDDEN: ErrorCode.AUTH_FORBIDDEN,
  AUTH_ACCOUNT_DISABLED: ErrorCode.AUTH_ACCOUNT_DISABLED,
  AUTH_PASSWORD_CHANGE_REQUIRED: ErrorCode.AUTH_PASSWORD_CHANGE_REQUIRED,
  AUTH_INVALID_CREDENTIALS: ErrorCode.AUTH_INVALID_CREDENTIALS,
  AUTH_CAPTCHA_REQUIRED: ErrorCode.AUTH_CAPTCHA_REQUIRED,
  AUTH_MFA_REQUIRED: ErrorCode.AUTH_MFA_REQUIRED,
} as const;

/** 认证域业务错误码字符串联合类型。 */
export type AuthErrorCode =
  (typeof AuthErrorCode)[keyof typeof AuthErrorCode];

/** 所有 {@link AuthErrorCode} 字面量列表（测试与 OpenAPI 生成用）。 */
export const AUTH_ERROR_CODE_VALUES: readonly AuthErrorCode[] =
  Object.values(AuthErrorCode);

/**
 * 判断字符串是否为合法 {@link AuthErrorCode}。
 */
export function isAuthErrorCode(value: string): value is AuthErrorCode {
  return AUTH_ERROR_CODE_VALUES.includes(value as AuthErrorCode);
}

/**
 * 认证错误码 → 建议 HTTP 状态（与全局 {@link ERROR_CODE_HTTP_STATUS} 一致）。
 */
export function authErrorHttpStatus(code: AuthErrorCode): number {
  return ERROR_CODE_HTTP_STATUS[code as ErrorCodeType];
}
