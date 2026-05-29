import type {
  AdminUserCreateBody,
  AdminUserListItem,
  AdminUserStatusBody,
  AdminUserUpdateBody,
} from "@lexos/shared";
import type { PaginationMeta } from "@lexos/shared/api";
import { apiFetch } from "./api-client";

/** 管理员用户详情（`GET /api/admin/users/:id`）。 */
export interface AdminUserDetailData {
  readonly id: string;
  readonly username: string;
  readonly displayName: string;
  readonly role: AdminUserListItem["role"];
  readonly contact: string | null;
  readonly status: AdminUserListItem["status"];
  readonly requiresPasswordChange: boolean;
  readonly mfaEnabled: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** `GET /api/admin/users` 响应。 */
export interface AdminUserListData {
  readonly items: readonly AdminUserListItem[];
  readonly meta: PaginationMeta & { readonly total?: number };
}

/** 列表查询参数（query string）。 */
export interface AdminUserListParams {
  readonly limit?: string;
  readonly cursor?: string;
  readonly offset?: string;
  readonly role?: string;
  readonly status?: string;
  readonly q?: string;
}

/** 构建列表 API 查询字符串（测试可覆盖）。 */
export function buildAdminUsersQueryString(params?: AdminUserListParams): string {
  if (!params) {
    return "";
  }
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, value);
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/** `GET /api/admin/users` */
export async function listUsers(
  params?: AdminUserListParams,
): Promise<AdminUserListData> {
  const res = await apiFetch<AdminUserListData>(
    `/admin/users${buildAdminUsersQueryString(params)}`,
    { method: "GET" },
  );
  return res.data;
}

/** `GET /api/admin/users/:id` */
export async function getUser(userId: string): Promise<AdminUserDetailData> {
  const res = await apiFetch<AdminUserDetailData>(`/admin/users/${userId}`, {
    method: "GET",
  });
  return res.data;
}

/** `POST /api/admin/users` */
export async function createUser(
  body: AdminUserCreateBody,
): Promise<AdminUserDetailData> {
  const res = await apiFetch<AdminUserDetailData>("/admin/users", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data;
}

/** `PATCH /api/admin/users/:id` */
export async function updateUser(
  userId: string,
  body: AdminUserUpdateBody,
): Promise<AdminUserDetailData> {
  const res = await apiFetch<AdminUserDetailData>(`/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return res.data;
}

/** `PATCH /api/admin/users/:id/status` */
export async function setUserStatus(
  userId: string,
  body: AdminUserStatusBody,
): Promise<AdminUserDetailData> {
  const res = await apiFetch<AdminUserDetailData>(
    `/admin/users/${userId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
  return res.data;
}

/** `POST /api/admin/users/:id/reset-password` */
export async function resetPassword(
  userId: string,
): Promise<{ readonly ok: true; readonly userId: string }> {
  const res = await apiFetch<{ readonly ok: true; readonly userId: string }>(
    `/admin/users/${userId}/reset-password`,
    { method: "POST" },
  );
  return res.data;
}
