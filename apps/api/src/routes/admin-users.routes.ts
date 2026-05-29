import type { IncomingMessage, ServerResponse } from "node:http";
import { matchRoutePattern } from "../lib/route-match.js";
import type { AdminUsersListController } from "../controllers/admin-users-list.controller.js";
import type { AdminUsersCreateController } from "../controllers/admin-users-create.controller.js";
import type { AdminUsersGetController } from "../controllers/admin-users-get.controller.js";
import type { AdminUsersPatchController } from "../controllers/admin-users-patch.controller.js";
import type { AdminUsersStatusController } from "../controllers/admin-users-status.controller.js";
import type { AdminUsersResetPasswordController } from "../controllers/admin-users-reset-password.controller.js";

export interface AdminUsersRouteHandlers {
  readonly list: AdminUsersListController;
  readonly create: AdminUsersCreateController;
  readonly get: AdminUsersGetController;
  readonly patch: AdminUsersPatchController;
  readonly status: AdminUsersStatusController;
  readonly resetPassword: AdminUsersResetPasswordController;
}

/**
 * 分发 `/api/admin/users*` 路由；返回是否已处理。
 */
export async function handleAdminUsersRoute(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  handlers: AdminUsersRouteHandlers,
): Promise<boolean> {
  const method = req.method ?? "GET";

  if (method === "GET" && path === "/api/admin/users") {
    await handlers.list.handle(req, res);
    return true;
  }

  if (method === "POST" && path === "/api/admin/users") {
    await handlers.create.handle(req, res);
    return true;
  }

  const getParams = matchRoutePattern("/api/admin/users/:id", path);
  if (method === "GET" && getParams) {
    await handlers.get.handle(req, res, getParams);
    return true;
  }

  if (method === "PATCH" && getParams) {
    await handlers.patch.handle(req, res, getParams);
    return true;
  }

  const statusParams = matchRoutePattern("/api/admin/users/:id/status", path);
  if (method === "PATCH" && statusParams) {
    await handlers.status.handle(req, res, statusParams);
    return true;
  }

  const resetParams = matchRoutePattern(
    "/api/admin/users/:id/reset-password",
    path,
  );
  if (method === "POST" && resetParams) {
    await handlers.resetPassword.handle(req, res, resetParams);
    return true;
  }

  return false;
}
