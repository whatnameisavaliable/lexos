import type { UserRole } from "@/types/user";

export interface MenuItem {
  label: string;
  href: string;
}

export const roleHomePath: Record<UserRole, string> = {
  admin: "/admin/users",
  lawyer: "/lawyer",
  client: "/client",
  channel_partner: "/channel",
  director: "/director",
};

export const roleMenuTemplates: Record<UserRole, MenuItem[]> = {
  admin: [
    { label: "用户管理", href: "/admin/users" },
    { label: "审计日志", href: "/admin/audit" },
  ],
  lawyer: [{ label: "工作台", href: "/lawyer" }],
  client: [{ label: "我的案件", href: "/client" }],
  channel_partner: [{ label: "渠道看板", href: "/channel" }],
  director: [{ label: "管理看板", href: "/director" }],
};
