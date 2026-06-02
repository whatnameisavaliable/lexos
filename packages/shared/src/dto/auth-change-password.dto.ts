import { z } from "zod";

/** 新密码最大长度（与 Supabase Auth 常见上限对齐）。 */
export const NEW_PASSWORD_MAX_LENGTH = 128;

const newPasswordSchema = z
  .string()
  .min(1, "newPassword must not be empty")
  .max(NEW_PASSWORD_MAX_LENGTH);

const currentPasswordSchema = z.string().min(1).max(NEW_PASSWORD_MAX_LENGTH);

/** 空字符串视为未提供（前端隐藏字段常留 `""`）。 */
const optionalCurrentPasswordSchema = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? undefined : val),
  currentPasswordSchema.optional(),
);

/**
 * `POST /api/auth/change-password` 请求体（PRD §2.5.4、§3.2）。
 *
 * `currentPassword` 在主动改密时由 Service 层必填；强制改密（`requires_password_change`）
 * 场景下可省略，由 {@link AuthContext.requiresPasswordChange} 分支校验。
 */
export const authChangePasswordBodySchema = z.object({
  currentPassword: optionalCurrentPasswordSchema,
  newPassword: newPasswordSchema,
});

/** 改密请求 DTO（解析后）。 */
export type AuthChangePasswordBody = z.infer<typeof authChangePasswordBodySchema>;

/**
 * 解析并校验改密请求体；失败抛出 `ZodError`。
 */
export function parseAuthChangePasswordBody(
  input: unknown,
): AuthChangePasswordBody {
  return authChangePasswordBodySchema.parse(input);
}

/**
 * 主动改密是否提供了当前密码（Service 在 `requiresPasswordChange=false` 时须校验非空）。
 */
export function hasCurrentPassword(
  body: AuthChangePasswordBody,
): body is AuthChangePasswordBody & { currentPassword: string } {
  return typeof body.currentPassword === "string" && body.currentPassword.length > 0;
}
