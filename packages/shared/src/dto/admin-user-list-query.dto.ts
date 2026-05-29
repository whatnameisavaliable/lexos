import { z } from "zod";
import { MAX_PAGE_LIMIT, parseLimit } from "../api/pagination.js";
import { PROFILE_STATUS_VALUES } from "./admin-user-status.dto.js";
import { USER_ROLE_VALUES, type UserRole } from "../types/user-role.js";

const roleFilterSchema = z.enum(
  USER_ROLE_VALUES as [UserRole, ...UserRole[]],
);

const statusFilterSchema = z.enum(PROFILE_STATUS_VALUES);

/**
 * `GET /api/admin/users` 查询参数（camelCase 经 Controller 映射）。
 */
export const adminUserListQuerySchema = z
  .object({
    limit: z.union([z.string(), z.number()]).optional(),
    cursor: z.string().trim().min(1).optional(),
    offset: z.coerce.number().int().min(0).optional(),
    role: roleFilterSchema.optional(),
    status: statusFilterSchema.optional(),
    q: z.string().trim().min(1).max(128).optional(),
  })
  .refine(
    (value) => !(value.cursor && value.offset !== undefined),
    { message: "cursor and offset are mutually exclusive" },
  );

/** 原始查询参数（解析 limit 前）。 */
export type AdminUserListQueryRaw = z.infer<typeof adminUserListQuerySchema>;

/** 列表查询 DTO（含已解析的 `limit`）。 */
export interface AdminUserListQuery {
  readonly limit: number;
  readonly cursor?: string;
  readonly offset?: number;
  readonly role?: UserRole;
  readonly status?: (typeof PROFILE_STATUS_VALUES)[number];
  readonly q?: string;
}

/**
 * 解析并校验管理员用户列表查询参数；失败抛出 `ZodError`。
 */
export function parseAdminUserListQuery(input: unknown): AdminUserListQuery {
  const raw = adminUserListQuerySchema.parse(input);
  const limit = parseLimit({ requested: raw.limit, maxLimit: MAX_PAGE_LIMIT });
  return {
    limit,
    cursor: raw.cursor,
    offset: raw.offset,
    role: raw.role,
    status: raw.status,
    q: raw.q,
  };
}
