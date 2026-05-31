import type { SessionResponseData } from "./auth-api.js";

/** 公开路径（无需会话）。 */
export const PUBLIC_PATHS = new Set([
  "/login",
  "/unauthorized",
]);

/**
 * 根据会话判断应重定向的路径；`null` 表示允许当前导航。
 * 首期不含 MFA 绑定门禁。
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

  if (pathname.startsWith("/admin") && session.role !== "admin") {
    return "/unauthorized";
  }

  if (pathname === "/login") {
    return session.role === "admin" ? "/admin" : "/lawyer";
  }

  return null;
}
