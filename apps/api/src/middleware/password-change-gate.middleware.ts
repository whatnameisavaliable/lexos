import type { ServerResponse } from "node:http";
import { AuthErrorCode } from "@lexos/shared";
import { sendApiError } from "./error-handler.middleware.js";
import { getRequestContext } from "./request-context.js";

/** 强制改密期间允许访问的 API 路径（`architecture.md` §5.2.1）。 */
export const PASSWORD_CHANGE_WHITELIST_PATHS: readonly string[] = [
  "/api/auth/change-password",
  "/api/auth/session",
  "/api/auth/logout",
];

/**
 * `requires_password_change=true` 时拦截非白名单业务 API。
 */
export function enforcePasswordChangeGate(res: ServerResponse): boolean {
  const ctx = getRequestContext();
  if (!ctx?.auth?.requiresPasswordChange) {
    return true;
  }

  if (PASSWORD_CHANGE_WHITELIST_PATHS.includes(ctx.path)) {
    return true;
  }

  sendApiError(
    res,
    AuthErrorCode.AUTH_PASSWORD_CHANGE_REQUIRED,
    "Password change required before accessing this resource",
    ctx.requestId,
  );
  return false;
}
