import { z } from "zod";
import { USER_ROLE_VALUES, type UserRole } from "../types/user-role.js";
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from "../validation/username.js";
import {
  CONTACT_MAX_LENGTH,
  DISPLAY_NAME_MAX_LENGTH,
} from "./profile-update.dto.js";

const usernameSchema = z
  .string()
  .trim()
  .min(USERNAME_MIN_LENGTH, "username is required")
  .max(USERNAME_MAX_LENGTH)
  .transform((value) => value.toLowerCase())
  .refine((value) => USERNAME_PATTERN.test(value), {
    message:
      "username may only contain lowercase letters, digits, and underscores",
  });

const roleSchema = z.enum(
  USER_ROLE_VALUES as [UserRole, ...UserRole[]],
  { message: "role must be a valid user role" },
);

/**
 * `POST /api/admin/users` 请求体（PRD §2.4–§2.5.1；禁止客户端指定 `status` / `requires_password_change`）。
 */
export const adminUserCreateBodySchema = z.object({
  username: usernameSchema,
  displayName: z
    .string()
    .trim()
    .min(1, "displayName is required")
    .max(DISPLAY_NAME_MAX_LENGTH),
  role: roleSchema,
  contact: z
    .string()
    .trim()
    .max(CONTACT_MAX_LENGTH)
    .optional(),
});

/** 管理员创建用户 DTO（解析后）。 */
export type AdminUserCreateBody = z.infer<typeof adminUserCreateBodySchema>;

/**
 * 解析并校验管理员创建用户请求体；失败抛出 `ZodError`。
 */
export function parseAdminUserCreateBody(input: unknown): AdminUserCreateBody {
  return adminUserCreateBodySchema.parse(input);
}

/**
 * 将创建 DTO 中的用户名规范化为 `profiles.username` 格式。
 */
export function adminUserCreateNormalizedUsername(
  body: AdminUserCreateBody,
): string {
  return body.username;
}
