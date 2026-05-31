import type { IncomingMessage, ServerResponse } from "node:http";
import { matchRoutePattern } from "../lib/route-match.js";
import type { AuditLogsListController } from "../controllers/audit-logs-list.controller.js";
import type { AuditLogGetController } from "../controllers/audit-log-get.controller.js";

export interface AdminAuditRouteHandlers {
  readonly logsList: AuditLogsListController;
  readonly logGet: AuditLogGetController;
}

/**
 * 分发 `/api/admin/audit/*` 路由；返回是否已处理。
 */
export async function handleAdminAuditRoute(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  handlers: AdminAuditRouteHandlers,
): Promise<boolean> {
  const method = req.method ?? "GET";

  if (method === "GET" && path === "/api/admin/audit/logs") {
    await handlers.logsList.handle(req, res);
    return true;
  }

  const logParams = matchRoutePattern("/api/admin/audit/logs/:id", path);
  if (method === "GET" && logParams) {
    await handlers.logGet.handle(req, res, logParams);
    return true;
  }

  return false;
}
