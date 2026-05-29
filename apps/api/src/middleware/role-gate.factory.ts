import type { ServerResponse } from "node:http";
import { AuthErrorCode, type UserRole } from "@lexos/shared";
import { sendApiError } from "./error-handler.middleware.js";
import { getRequestContext } from "./request-context.js";

/**
 * 角色门禁工厂（`architecture.md` §5.3.1）。
 *
 * @param allowedRoles - 允许访问的路由角色列表
 * @returns 校验函数；未通过时写入 `AUTH_FORBIDDEN` 并返回 `false`
 */
export function requireRoles(
  ...allowedRoles: readonly UserRole[]
): (res: ServerResponse) => boolean {
  const allowed = new Set<UserRole>(allowedRoles);

  return (res: ServerResponse): boolean => {
    const ctx = getRequestContext();
    const role = ctx?.auth?.role;

    if (!role || !allowed.has(role)) {
      sendApiError(
        res,
        AuthErrorCode.AUTH_FORBIDDEN,
        "Insufficient role for this resource",
        ctx?.requestId,
      );
      return false;
    }

    return true;
  };
}
