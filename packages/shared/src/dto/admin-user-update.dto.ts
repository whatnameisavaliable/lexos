import { z } from "zod";
import { USER_ROLE_VALUES, type UserRole } from "../types/user-role.js";
import {
  CONTACT_MAX_LENGTH,
  DISPLAY_NAME_MAX_LENGTH,
} from "./profile-update.dto.js";

const roleSchema = z.enum(
  USER_ROLE_VALUES as [UserRole, ...UserRole[]],
  { message: "role must be a valid user role" },
);

/**
 * `PATCH /api/admin/users/:id` 请求体（禁止 `status` / `username` 自改入口）。
 */
export const adminUserUpdateBodySchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, "displayName cannot be empty")
      .max(DISPLAY_NAME_MAX_LENGTH)
      .optional(),
    role: roleSchema.optional(),
    contact: z
      .string()
      .trim()
      .max(CONTACT_MAX_LENGTH)
      .nullable()
      .optional(),
  })
  .refine(
    (value) =>
      value.displayName !== undefined ||
      value.role !== undefined ||
      value.contact !== undefined,
    { message: "at least one of displayName, role, or contact must be provided" },
  )
  .strict();

/** 管理员更新用户资料 DTO（解析后）。 */
export type AdminUserUpdateBody = z.infer<typeof adminUserUpdateBodySchema>;

/**
 * 解析并校验管理员更新用户请求体；失败抛出 `ZodError`。
 */
export function parseAdminUserUpdateBody(input: unknown): AdminUserUpdateBody {
  return adminUserUpdateBodySchema.parse(input);
}
