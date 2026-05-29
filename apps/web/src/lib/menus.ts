import type { UserRole } from "@lexos/shared";

/** 侧边栏导航项（由 `role` 驱动渲染，`ui_design.md` §5.1）。 */
export interface AppNavItem {
  readonly href: string;
  readonly label: string;
  readonly allowedRoles: readonly UserRole[];
}

/** 首期业务导航（禁止仅用 CSS 隐藏无权限路由）。 */
export const APP_NAV_ITEMS: readonly AppNavItem[] = [
  { href: "/admin/users", label: "用户管理", allowedRoles: ["admin"] },
  { href: "/admin/ai", label: "AI 配置", allowedRoles: ["admin"] },
  { href: "/admin", label: "管理首页", allowedRoles: ["admin"] },
  { href: "/lawyer", label: "律师工作台", allowedRoles: ["lawyer", "admin"] },
  { href: "/profile", label: "个人中心", allowedRoles: ["admin", "lawyer", "director", "client", "channel"] },
] as const;

/**
 * 按角色过滤可见菜单。
 */
export function navItemsForRole(role: UserRole): readonly AppNavItem[] {
  return APP_NAV_ITEMS.filter((item) => item.allowedRoles.includes(role));
}

/** `/admin/*` 路由允许的角色。 */
export const ADMIN_ROUTE_ROLES: readonly UserRole[] = ["admin"];

/**
 * 判断路径是否允许当前角色访问（与 `router-guard` 一致）。
 */
export function isPathAllowedForRole(pathname: string, role: UserRole): boolean {
  if (pathname.startsWith("/admin")) {
    return ADMIN_ROUTE_ROLES.includes(role);
  }
  return true;
}
