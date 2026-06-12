import { DEFAULT_INITIAL_PASSWORD, isLawyerRole, type UserRole } from "../domain/core.ts";

export const DEFAULT_AUTH_EMAIL_DOMAIN = "lexos.local";

export type UserAccountStatus = "active" | "disabled";

const internalUserRoles = new Set<UserRole>([
  "system_admin",
  "firm_admin",
  "director",
  "lawyer",
  "finance",
  "channel_partner",
]);
const userAccountStatuses = new Set<UserAccountStatus>(["active", "disabled"]);

export type CreateUserInput = {
  username: string;
  displayName: string;
  roleCode: UserRole;
  rankId?: string;
  phone?: string;
  authEmailDomain?: string;
};

export type ValidatedCreateUserInput = {
  username: string;
  displayName: string;
  roleCode: UserRole;
  rankId?: string;
  phone?: string;
  authEmail: string;
  defaultPassword: typeof DEFAULT_INITIAL_PASSWORD;
  mustChangePassword: true;
};

export type UpdateUserInput = {
  rankId?: string;
  roleCode: UserRole;
  status: UserAccountStatus;
};

export type ValidatedUpdateUserInput = UpdateUserInput;

export function normalizeUsername(username: string): string {
  const normalized = username.trim().toLowerCase();

  if (normalized.length < 3 || normalized.length > 32) {
    throw new Error("用户名长度必须在 3 到 32 个字符之间");
  }

  if (!/^[a-z0-9_]+$/.test(normalized)) {
    throw new Error("用户名只能包含小写字母、数字和下划线");
  }

  return normalized;
}

export function buildAuthEmailForUsername(username: string, domain = DEFAULT_AUTH_EMAIL_DOMAIN): string {
  const normalized = normalizeUsername(username);
  const cleanDomain = domain.trim().toLowerCase();

  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(cleanDomain)) {
    throw new Error("内部认证邮箱域名格式不正确");
  }

  return `${normalized}@${cleanDomain}`;
}

export function validateCreateUserInput(input: CreateUserInput): ValidatedCreateUserInput {
  const username = normalizeUsername(input.username);
  const displayName = input.displayName.trim();

  if (!displayName) {
    throw new Error("姓名不能为空");
  }

  if (!internalUserRoles.has(input.roleCode)) {
    throw new Error("角色不允许创建内部用户");
  }

  if (isLawyerRole(input.roleCode) && !input.rankId) {
    throw new Error("律师必须绑定职级");
  }

  return {
    username,
    displayName,
    roleCode: input.roleCode,
    rankId: isLawyerRole(input.roleCode) ? input.rankId : undefined,
    phone: input.phone?.trim() || undefined,
    authEmail: buildAuthEmailForUsername(username, input.authEmailDomain ?? DEFAULT_AUTH_EMAIL_DOMAIN),
    defaultPassword: DEFAULT_INITIAL_PASSWORD,
    mustChangePassword: true,
  };
}

export function validateUpdateUserInput(input: UpdateUserInput): ValidatedUpdateUserInput {
  if (!internalUserRoles.has(input.roleCode)) {
    throw new Error("角色不允许用于内部用户");
  }

  if (!userAccountStatuses.has(input.status)) {
    throw new Error("用户状态不正确");
  }

  if (isLawyerRole(input.roleCode) && !input.rankId) {
    throw new Error("律师必须绑定职级");
  }

  return {
    roleCode: input.roleCode,
    rankId: isLawyerRole(input.roleCode) ? input.rankId : undefined,
    status: input.status,
  };
}
