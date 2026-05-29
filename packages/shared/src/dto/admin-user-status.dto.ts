import { z } from "zod";

/** `profiles.status` 合法取值（`database.md` §1.2）。 */
export const PROFILE_STATUS_VALUES = ["enabled", "disabled"] as const;

/** 用户账户状态。 */
export type ProfileStatus = (typeof PROFILE_STATUS_VALUES)[number];

const statusSchema = z.enum(PROFILE_STATUS_VALUES, {
  message: "status must be enabled or disabled",
});

/**
 * `PATCH /api/admin/users/:id/status` 请求体。
 */
export const adminUserStatusBodySchema = z.object({
  status: statusSchema,
});

/** 管理员启用/禁用用户 DTO（解析后）。 */
export type AdminUserStatusBody = z.infer<typeof adminUserStatusBodySchema>;

/**
 * 解析并校验用户状态变更请求体；失败抛出 `ZodError`。
 */
export function parseAdminUserStatusBody(input: unknown): AdminUserStatusBody {
  return adminUserStatusBodySchema.parse(input);
}
