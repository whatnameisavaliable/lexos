import type { IncomingMessage, ServerResponse } from "node:http";
import { matchRoutePattern } from "../lib/route-match.js";
import type { DriveRootController } from "../controllers/drive-root.controller.js";
import type { DriveNodesListController } from "../controllers/drive-nodes-list.controller.js";
import type { DriveNodeGetController } from "../controllers/drive-node-get.controller.js";
import type { DriveFolderCreateController } from "../controllers/drive-folder-create.controller.js";
import type { DriveNodePatchController } from "../controllers/drive-node-patch.controller.js";
import type { DriveNodeDeleteController } from "../controllers/drive-node-delete.controller.js";
import type { DriveSearchController } from "../controllers/drive-search.controller.js";
import type { DriveFileDownloadController } from "../controllers/drive-file-download.controller.js";

export interface DriveRouteHandlers {
  readonly root: DriveRootController;
  readonly listNodes: DriveNodesListController;
  readonly getNode: DriveNodeGetController;
  readonly createFolder: DriveFolderCreateController;
  readonly patchNode: DriveNodePatchController;
  readonly deleteNode: DriveNodeDeleteController;
  readonly search: DriveSearchController;
  readonly downloadFile: DriveFileDownloadController;
}

/**
 * 分发 `/api/drive/*` 路由（`architecture.md` §7）。
 */
export async function handleDriveRoute(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  handlers: DriveRouteHandlers,
): Promise<boolean> {
  const method = req.method ?? "GET";

  if (method === "GET" && path === "/api/drive/root") {
    await handlers.root.handle(req, res);
    return true;
  }

  if (method === "GET" && path === "/api/drive/nodes") {
    await handlers.listNodes.handle(req, res);
    return true;
  }

  if (method === "GET" && path === "/api/drive/search") {
    await handlers.search.handle(req, res);
    return true;
  }

  const downloadParams = matchRoutePattern(
    "/api/drive/files/:id/download",
    path,
  );
  if (method === "GET" && downloadParams) {
    await handlers.downloadFile.handle(req, res, downloadParams);
    return true;
  }

  if (method === "POST" && path === "/api/drive/folders") {
    await handlers.createFolder.handle(req, res);
    return true;
  }

  const nodeParams = matchRoutePattern("/api/drive/nodes/:id", path);
  if (method === "GET" && nodeParams) {
    await handlers.getNode.handle(req, res, nodeParams);
    return true;
  }
  if (method === "PATCH" && nodeParams) {
    await handlers.patchNode.handle(req, res, nodeParams);
    return true;
  }
  if (method === "DELETE" && nodeParams) {
    await handlers.deleteNode.handle(req, res, nodeParams);
    return true;
  }

  return false;
}
