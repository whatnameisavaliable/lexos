export const DEFAULT_INITIAL_PASSWORD = "111111";

export type UserRole =
  | "system_admin"
  | "firm_admin"
  | "director"
  | "lawyer"
  | "finance"
  | "customer"
  | "channel_partner";

export const userRoles = [
  "system_admin",
  "firm_admin",
  "director",
  "lawyer",
  "finance",
  "customer",
  "channel_partner",
] as const satisfies readonly UserRole[];

export const lawyerRoles = ["lawyer"] as const satisfies readonly UserRole[];
export const legacyLawyerRoleCodes = ["source_lawyer", "handling_lawyer"] as const;
export const lawyerRoleCodes = [...lawyerRoles, ...legacyLawyerRoleCodes] as const;
export const systemConfigRoles = ["system_admin", "firm_admin"] as const satisfies readonly UserRole[];

export function normalizeUserRole(role: string): UserRole | undefined {
  if ((userRoles as readonly string[]).includes(role)) {
    return role as UserRole;
  }

  if ((legacyLawyerRoleCodes as readonly string[]).includes(role)) {
    return "lawyer";
  }

  return undefined;
}

export function requireKnownUserRole(role: string): UserRole {
  const normalizedRole = normalizeUserRole(role);

  if (!normalizedRole) {
    throw new Error(`Unsupported user role: ${role}`);
  }

  return normalizedRole;
}

export function isLawyerRole(role: string): boolean {
  return normalizeUserRole(role) === "lawyer";
}

export function isSystemConfigRole(role: string): boolean {
  const normalizedRole = normalizeUserRole(role);

  return Boolean(normalizedRole && systemConfigRoles.includes(normalizedRole as (typeof systemConfigRoles)[number]));
}

export function isDirectorRole(role: string): boolean {
  return normalizeUserRole(role) === "director";
}

export function canViewFirmWide(role: string): boolean {
  return isDirectorRole(role);
}

export type TaskStatus =
  | "open"
  | "claimed"
  | "submitted"
  | "approved"
  | "customer_confirmed"
  | "settlement_pending"
  | "settled"
  | "cancelled";

export type TaskAction =
  | "claim"
  | "submit"
  | "approve"
  | "customer_confirm"
  | "generate_settlement"
  | "settle"
  | "cancel";

export type InitialUserProfile = {
  username: string;
  displayName: string;
  defaultPassword: typeof DEFAULT_INITIAL_PASSWORD;
  mustChangePassword: true;
};

const taskTransitions: Record<TaskStatus, Partial<Record<TaskAction, TaskStatus>>> = {
  open: {
    claim: "claimed",
    cancel: "cancelled",
  },
  claimed: {
    submit: "submitted",
    cancel: "cancelled",
  },
  submitted: {
    approve: "approved",
    cancel: "cancelled",
  },
  approved: {
    customer_confirm: "customer_confirmed",
    cancel: "cancelled",
  },
  customer_confirmed: {
    generate_settlement: "settlement_pending",
  },
  settlement_pending: {
    settle: "settled",
  },
  settled: {},
  cancelled: {},
};

export function calculateSettlementAmount(amountCents: number, settlementBasisPoints: number): number {
  if (!Number.isInteger(amountCents) || amountCents < 0) {
    throw new Error("任务金额必须是非负整数分");
  }

  if (!Number.isInteger(settlementBasisPoints) || settlementBasisPoints < 0 || settlementBasisPoints > 10000) {
    throw new Error("结算比例必须是 0 到 10000 之间的整数");
  }

  return Math.floor((amountCents * settlementBasisPoints) / 10000);
}

export function createInitialUserProfile(username: string, displayName: string): InitialUserProfile {
  if (!username.trim()) {
    throw new Error("用户名不能为空");
  }

  if (!displayName.trim()) {
    throw new Error("显示名称不能为空");
  }

  return {
    username,
    displayName,
    defaultPassword: DEFAULT_INITIAL_PASSWORD,
    mustChangePassword: true,
  };
}

export function canClaimTask(input: {
  taskStatus: TaskStatus;
  userRole: UserRole;
  lawyerRankOrder: number;
  minRankOrder: number;
}): boolean {
  return (
    input.taskStatus === "open" &&
    isLawyerRole(input.userRole) &&
    Number.isInteger(input.lawyerRankOrder) &&
    Number.isInteger(input.minRankOrder) &&
    input.lawyerRankOrder >= input.minRankOrder
  );
}

export function transitionTaskStatus(currentStatus: TaskStatus, action: TaskAction): TaskStatus {
  const nextStatus = taskTransitions[currentStatus][action];

  if (!nextStatus) {
    throw new Error(`非法任务状态流转：${currentStatus} -> ${action}`);
  }

  return nextStatus;
}
