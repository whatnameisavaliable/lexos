/**
 * 登录/创建用用户名规范化（PRD §2.5.1；`profiles.username` VARCHAR(64)）。
 */
export const USERNAME_MIN_LENGTH = 1;
export const USERNAME_MAX_LENGTH = 64;

/** 允许小写字母、数字、下划线（与虚拟邮箱本地段一致）。 */
export const USERNAME_PATTERN = /^[a-z0-9_]+$/;

/**
 * 将输入规范为小写去首尾空格的登录用户名。
 * @throws 若为空或超长或含非法字符
 */
export function normalizeUsername(raw: string): string {
  const normalized = raw.trim().toLowerCase();
  if (
    normalized.length < USERNAME_MIN_LENGTH ||
    normalized.length > USERNAME_MAX_LENGTH
  ) {
    throw new Error(
      `username must be ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters`,
    );
  }
  if (!USERNAME_PATTERN.test(normalized)) {
    throw new Error(
      "username may only contain lowercase letters, digits, and underscores",
    );
  }
  return normalized;
}
