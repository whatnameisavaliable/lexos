import { isLawyerRole, isSystemConfigRole, type UserRole } from "../domain/core.ts";

export type MenuPermissionKey =
  | "dashboard"
  | "users"
  | "ranks"
  | "customers"
  | "market"
  | "my-tasks"
  | "risk"
  | "settlements"
  | "funds"
  | "audit"
  | "settings"
  | "permissions";

export type MenuPermissionItem = {
  description: string;
  key: MenuPermissionKey;
  label: string;
  roles: UserRole[];
};

const configRoles: UserRole[] = ["system_admin", "firm_admin"];
const lawyerMenuRoles: UserRole[] = ["source_lawyer", "handling_lawyer"];

export const roleLabels: Record<UserRole, string> = {
  system_admin: "系统管理员",
  firm_admin: "配置管理员",
  director: "主任",
  source_lawyer: "律师",
  handling_lawyer: "律师",
  finance: "财务",
  customer: "客户",
  channel_partner: "渠道伙伴",
};

export const roleDescriptions: Record<UserRole, string> = {
  system_admin: "维护系统参数、权限、审计和账号配置，不参与业务数据经营视图。",
  firm_admin: "维护律所成员、职级、参数和权限矩阵，不承担案源或承办视图。",
  director: "查看全所经营、任务、客户、风险、结算和人员状态。",
  source_lawyer: "维护本人客户，发起任务，承办任务，查看个人风险、结算和绩效。",
  handling_lawyer: "维护本人客户，发起任务，承办任务，查看个人风险、结算和绩效。",
  finance: "处理结算确认、资金流水和财务对账。",
  customer: "通过安全链接查看指定任务进度和交付成果。",
  channel_partner: "后续用于提交线索并查看渠道贡献。",
};

export const internalUserRoleOptions: Array<[UserRole, string]> = [
  ["system_admin", roleLabels.system_admin],
  ["firm_admin", roleLabels.firm_admin],
  ["director", roleLabels.director],
  ["handling_lawyer", roleLabels.handling_lawyer],
  ["finance", roleLabels.finance],
];

export const menuPermissionItems: MenuPermissionItem[] = [
  {
    description: "个人或全所经营总览，按角色显示任务、客户、结算、风险和质量信号。",
    key: "dashboard",
    label: "总览",
    roles: ["director", "source_lawyer", "handling_lawyer", "finance"],
  },
  {
    description: "查看成员状态；配置管理员可创建账号并维护角色、职级和账号状态。",
    key: "users",
    label: "人员",
    roles: ["system_admin", "firm_admin", "director"],
  },
  {
    description: "查看 L1A 至 L3C 职级与结算比例；配置管理员可作为系统配置维护。",
    key: "ranks",
    label: "职级",
    roles: ["system_admin", "firm_admin", "director"],
  },
  {
    description: "维护本人客户资料；主任查看全所客户来源和客户状态。",
    key: "customers",
    label: "客户",
    roles: ["director", "source_lawyer", "handling_lawyer"],
  },
  {
    description: "律师查看开放任务并按职级条件承接；主任查看全所任务供给。",
    key: "market",
    label: "任务大厅",
    roles: ["director", "source_lawyer", "handling_lawyer"],
  },
  {
    description: "律师处理本人发起或承办任务；主任查看全所任务流转。",
    key: "my-tasks",
    label: "任务",
    roles: ["director", "source_lawyer", "handling_lawyer"],
  },
  {
    description: "律师登记和处理本人相关风控；主任查看全所风险、答辩和委员会处理状态。",
    key: "risk",
    label: "风控",
    roles: ["director", "source_lawyer", "handling_lawyer"],
  },
  {
    description: "律师查看个人结算，财务处理确认，主任查看全所结算结构。",
    key: "settlements",
    label: "结算",
    roles: ["director", "source_lawyer", "handling_lawyer", "finance"],
  },
  {
    description: "查看扣罚资金流向、公共风险储备金、质量督导基金和退款留存台账。",
    key: "funds",
    label: "资金",
    roles: ["director", "finance"],
  },
  {
    description: "查看登录、业务操作和安全事件审计记录。",
    key: "audit",
    label: "审计",
    roles: ["system_admin", "firm_admin", "director"],
  },
  {
    description: "维护客户大屏验证码、分页、结算锁定期等系统参数。",
    key: "settings",
    label: "参数",
    roles: configRoles,
  },
  {
    description: "查看当前角色菜单能力矩阵和权限覆盖情况。",
    key: "permissions",
    label: "权限",
    roles: configRoles,
  },
];

export function canAccessMenu(role: UserRole, key: MenuPermissionKey): boolean {
  return menuPermissionItems.some((item) => item.key === key && item.roles.includes(role));
}

export function getAccessibleMenuItems(role: UserRole): MenuPermissionItem[] {
  return menuPermissionItems.filter((item) => item.roles.includes(role));
}

export function getDefaultMenuKey(role: UserRole): MenuPermissionKey {
  if (isSystemConfigRole(role)) {
    return "users";
  }

  if (isLawyerRole(role)) {
    return "dashboard";
  }

  return getAccessibleMenuItems(role)[0]?.key ?? "dashboard";
}

export function isLawyerMenuRole(role: UserRole): boolean {
  return lawyerMenuRoles.includes(role);
}
