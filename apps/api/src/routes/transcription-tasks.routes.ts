import type { IncomingMessage, ServerResponse } from "node:http";
import { matchRoutePattern } from "../lib/route-match.js";
import type { TranscriptionTasksListController } from "../controllers/transcription-tasks-list.controller.js";
import type { TranscriptionTasksGetController } from "../controllers/transcription-tasks-get.controller.js";

export interface TranscriptionTasksRouteHandlers {
  readonly list: TranscriptionTasksListController;
  readonly get: TranscriptionTasksGetController;
}

/**
 * 分发 `/api/transcription/tasks*`。
 */
export async function handleTranscriptionTasksRoute(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  handlers: TranscriptionTasksRouteHandlers,
): Promise<boolean> {
  const method = req.method ?? "GET";

  if (method === "GET" && path === "/api/transcription/tasks") {
    await handlers.list.handle(req, res);
    return true;
  }

  const getParams = matchRoutePattern("/api/transcription/tasks/:id", path);
  if (method === "GET" && getParams) {
    await handlers.get.handle(req, res, getParams);
    return true;
  }

  return false;
}
