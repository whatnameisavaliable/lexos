import type { SessionResponseData } from "./auth-api.js";

/** 需登录才可访问的路径前缀（业务区）。 */
export const PROTECTED_PATH_PREFIXES = ["/lawyer", "/admin", "/profile"] as const;

/** 公开路径（无需会话）。 */
export const PUBLIC_PATHS = new Set([
  "/login",
  "/unauthorized",
]);

/** 改密/MFA 白名单路径。 */
export const AUTH_FLOW_PATHS = new Set(["/change-password", "/mfa/setup"]);

/**
 * 根据会话判断应重定向的路径；`null` 表示允许当前导航。
 */
export function resolveGuardRedirect(
  pathname: string,
  session: SessionResponseData | null,
): string | null {
  const isPublic =
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api");

  if (!session) {
    return isPublic ? null : "/login";
  }

  if (session.requiresPasswordChange) {
    return pathname === "/change-password" ? null : "/change-password";
  }

  const mfaRequired =
    (session.role === "admin" || session.role === "director") &&
    !session.mfaEnabled;

  if (mfaRequired) {
    return pathname === "/mfa/setup" ? null : "/mfa/setup";
  }

  if (pathname.startsWith("/admin") && session.role !== "admin") {
    return "/unauthorized";
  }

  if (pathname === "/login" || pathname === "/change-password" || pathname === "/mfa/setup") {
    return session.role === "admin" ? "/admin" : "/lawyer";
  }

  return null;
}
