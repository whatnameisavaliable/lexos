import { z } from "zod";

/** 新密码最小长度（须高于弱口令 `111111`；Supabase Auth 默认 ≥6）。 */
export const NEW_PASSWORD_MIN_LENGTH = 8;

/** 新密码最大长度（与 Supabase Auth 常见上限对齐）。 */
export const NEW_PASSWORD_MAX_LENGTH = 128;

const newPasswordSchema = z
  .string()
  .min(
    NEW_PASSWORD_MIN_LENGTH,
    `newPassword must be at least ${NEW_PASSWORD_MIN_LENGTH} characters`,
  )
  .max(NEW_PASSWORD_MAX_LENGTH);

const currentPasswordSchema = z.string().min(1).max(NEW_PASSWORD_MAX_LENGTH);

/**
 * `POST /api/auth/change-password` 请求体（PRD §2.5.4、§3.2）。
 *
 * `currentPassword` 在主动改密时由 Service 层必填；强制改密（`requires_password_change`）
 * 场景下可省略，由 {@link AuthContext.requiresPasswordChange} 分支校验。
 */
export const authChangePasswordBodySchema = z.object({
  currentPassword: currentPasswordSchema.optional(),
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
