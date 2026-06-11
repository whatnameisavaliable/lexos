import type { UserRole } from "../domain/core.ts";

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

export const roleLabels: Record<UserRole, string> = {
  system_admin: "系统管理员",
  firm_admin: "律所管理员",
  director: "主任",
  source_lawyer: "案源律师",
  handling_lawyer: "办案律师",
  finance: "财务",
  customer: "客户",
  channel_partner: "渠道商",
};

export const roleDescriptions: Record<UserRole, string> = {
  system_admin: "负责系统初始化、权限、参数、审计和跨模块运维。",
  firm_admin: "负责律所成员、职级、客户、结算与日常运营管理。",
  director: "查看律所经营总览和关键运营信号。",
  source_lawyer: "维护客户与案源任务，验收办案成果。",
  handling_lawyer: "查看任务大厅、处理已接任务并跟踪个人结算。",
  finance: "处理结算确认、资金记录和财务对账。",
  customer: "通过安全链接查看指定任务进度和交付成果。",
  channel_partner: "后续用于提交线索并查看渠道贡献。",
};

export const internalUserRoleOptions: Array<[UserRole, string]> = [
  ["system_admin", roleLabels.system_admin],
  ["firm_admin", roleLabels.firm_admin],
  ["director", roleLabels.director],
  ["source_lawyer", roleLabels.source_lawyer],
  ["handling_lawyer", roleLabels.handling_lawyer],
  ["finance", roleLabels.finance],
];

export const menuPermissionItems: MenuPermissionItem[] = [
  {
    description: "查看个人工作台、任务流转、客户渠道、律师绩效和运营信号。",
    key: "dashboard",
    label: "总览",
    roles: ["system_admin", "firm_admin", "director", "source_lawyer", "handling_lawyer", "finance"],
  },
  {
    description: "创建用户，维护角色、职级绑定和账号状态。",
    key: "users",
    label: "用户",
    roles: ["system_admin", "firm_admin"],
  },
  {
    description: "查看 L1A 至 L3C 职级和结算比例。",
    key: "ranks",
    label: "职级",
    roles: ["system_admin", "firm_admin"],
  },
  {
    description: "维护客户基础资料和客户来源。",
    key: "customers",
    label: "客户",
    roles: ["system_admin", "firm_admin", "source_lawyer"],
  },
  {
    description: "查看开放任务并按职级条件抢单。",
    key: "market",
    label: "任务大厅",
    roles: ["system_admin", "handling_lawyer"],
  },
  {
    description: "查看自己发布或承办的任务，提交成果并验收任务。",
    key: "my-tasks",
    label: "我的任务",
    roles: ["system_admin", "firm_admin", "director", "source_lawyer", "handling_lawyer"],
  },
  {
    description: "登记客户投诉、低分风险和人工风控提醒，查看当前风控工单状态；办案律师可提交本人任务答辩。",
    key: "risk",
    label: "风控",
    roles: ["system_admin", "firm_admin", "director", "source_lawyer", "handling_lawyer"],
  },
  {
    description: "查看结算记录、导出 CSV，并确认待结算事项。",
    key: "settlements",
    label: "结算",
    roles: ["system_admin", "firm_admin", "finance", "handling_lawyer"],
  },
  {
    description: "查看扣罚资金流向、公共风险储备金、质量督导基金和退费留存台账。",
    key: "funds",
    label: "资金",
    roles: ["system_admin", "firm_admin", "finance"],
  },
  {
    description: "查看登录、业务操作和安全事件审计记录。",
    key: "audit",
    label: "审计",
    roles: ["system_admin", "firm_admin"],
  },
  {
    description: "维护客户大屏验证码、分页和结算锁定期等系统参数。",
    key: "settings",
    label: "参数",
    roles: ["system_admin", "firm_admin"],
  },
  {
    description: "查看当前角色菜单能力矩阵和权限覆盖情况。",
    key: "permissions",
    label: "权限",
    roles: ["system_admin", "firm_admin"],
  },
];

export function canAccessMenu(role: UserRole, key: MenuPermissionKey): boolean {
  return menuPermissionItems.some((item) => item.key === key && item.roles.includes(role));
}

export function getAccessibleMenuItems(role: UserRole): MenuPermissionItem[] {
  return menuPermissionItems.filter((item) => item.roles.includes(role));
}

export function getDefaultMenuKey(role: UserRole): MenuPermissionKey {
  return getAccessibleMenuItems(role)[0]?.key ?? "dashboard";
}
