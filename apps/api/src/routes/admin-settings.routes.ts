import type { IncomingMessage, ServerResponse } from "node:http";
import { matchRoutePattern } from "../lib/route-match.js";
import type { SettingsListController } from "../controllers/settings-list.controller.js";
import type { SettingsGetController } from "../controllers/settings-get.controller.js";
import type { SettingsUpsertController } from "../controllers/settings-upsert.controller.js";

export interface AdminSettingsRouteHandlers {
  readonly list: SettingsListController;
  readonly get: SettingsGetController;
  readonly upsert: SettingsUpsertController;
}

/**
 * 分发 `/api/admin/settings/*` 路由；返回是否已处理。
 */
export async function handleAdminSettingsRoute(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  handlers: AdminSettingsRouteHandlers,
): Promise<boolean> {
  const method = req.method ?? "GET";

  if (method === "GET" && path === "/api/admin/settings") {
    await handlers.list.handle(req, res);
    return true;
  }

  const keyParams = matchRoutePattern("/api/admin/settings/:key", path);
  if (keyParams) {
    if (method === "GET") {
      await handlers.get.handle(req, res, keyParams);
      return true;
    }
    if (method === "PUT") {
      await handlers.upsert.handle(req, res, keyParams);
      return true;
    }
  }

  return false;
}
