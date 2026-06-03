import { isReservedUserRole, type UserRole } from "@lexos/shared";
import type { SessionResponseData } from "./auth-api.js";

/** 公开路径（无需会话）。 */
export const PUBLIC_PATHS = new Set(["/login", "/unauthorized"]);

/** 预留角色可访问路径（个人中心只读 + 改密 + 占位页）。 */
export const RESERVED_ROLE_PATHS = new Set([
  "/coming-soon",
  "/profile",
  "/change-password",
]);

/** 律师业务区路径前缀（admin 禁止访问，PRD-2-06）。 */
export const LAWYER_BUSINESS_PATH_PREFIXES = [
  "/transcription",
  "/drive",
  "/lawyer",
  "/sops",
] as const;

/**
 * 登录成功后的默认首页。
 */
export function resolvePostLoginPath(role: string): string {
  if (role === "admin") {
    return "/admin";
  }
  if (isReservedUserRole(role as UserRole)) {
    return "/coming-soon";
  }
  return "/lawyer";
}

function isLawyerBusinessPath(pathname: string): boolean {
  return LAWYER_BUSINESS_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isReservedRolePath(pathname: string): boolean {
  if (RESERVED_ROLE_PATHS.has(pathname)) {
    return true;
  }
  return pathname.startsWith("/change-password");
}

/**
 * 根据会话判断应重定向的路径；`null` 表示允许当前导航。
 * 首期不含 MFA；admin 不可浏览律师业务数据（PRD-2-05/06）。
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

  if (session.role === "admin" && isLawyerBusinessPath(pathname)) {
    return "/admin";
  }

  if (
    session.role === "admin" &&
    (pathname === "/admin/transcription" ||
      pathname.startsWith("/admin/transcription/"))
  ) {
    return "/admin";
  }

  if (pathname.startsWith("/admin")) {
    return session.role === "admin" ? null : "/unauthorized";
  }

  if (isReservedUserRole(session.role as UserRole)) {
    if (!isReservedRolePath(pathname)) {
      return "/coming-soon";
    }
    return null;
  }

  if (pathname === "/login") {
    return resolvePostLoginPath(session.role);
  }

  return null;
}

/**
 * 判断路径是否允许当前角色访问（与 {@link resolveGuardRedirect} 一致）。
 */
export function isPathAllowedForRole(pathname: string, role: UserRole): boolean {
  return resolveGuardRedirect(pathname, {
    userId: "",
    username: "",
    displayName: "",
    role,
    contact: null,
    requiresPasswordChange: false,
    mfaEnabled: false,
    status: "enabled",
  }) === null;
}
