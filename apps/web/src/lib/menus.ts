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
  { href: "/admin/audit", label: "审计日志", allowedRoles: ["admin"] },
  { href: "/admin/settings", label: "系统设置", allowedRoles: ["admin"] },
  { href: "/admin/ai", label: "AI 配置", allowedRoles: ["admin"] },
  { href: "/admin/sops", label: "SOP 模板", allowedRoles: ["admin"] },
  { href: "/admin", label: "管理首页", allowedRoles: ["admin"] },
  { href: "/sops", label: "SOP 流水线", allowedRoles: ["lawyer"] },
  { href: "/transcription", label: "语音转写", allowedRoles: ["lawyer"] },
  { href: "/drive", label: "个人云盘", allowedRoles: ["lawyer"] },
  { href: "/lawyer", label: "律师工作台", allowedRoles: ["lawyer"] },
  {
    href: "/coming-soon",
    label: "首页",
    allowedRoles: ["director", "client", "channel"],
  },
  {
    href: "/profile",
    label: "个人中心",
    allowedRoles: ["admin", "lawyer", "director", "client", "channel"],
  },
] as const;

/**
 * 按角色过滤可见菜单。
 */
export function navItemsForRole(role: UserRole): readonly AppNavItem[] {
  return APP_NAV_ITEMS.filter((item) => item.allowedRoles.includes(role));
}

/** `/admin/*` 路由允许的角色。 */
export const ADMIN_ROUTE_ROLES: readonly UserRole[] = ["admin"];
