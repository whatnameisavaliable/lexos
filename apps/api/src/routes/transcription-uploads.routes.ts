import type { IncomingMessage, ServerResponse } from "node:http";
import type { TranscriptionUploadsInitController } from "../controllers/transcription-uploads-init.controller.js";
import type { TranscriptionUploadsCompleteController } from "../controllers/transcription-uploads-complete.controller.js";

export interface TranscriptionUploadsRouteHandlers {
  readonly init: TranscriptionUploadsInitController;
  readonly complete: TranscriptionUploadsCompleteController;
}

/**
 * 分发 `/api/transcription/uploads/*`。
 */
export async function handleTranscriptionUploadsRoute(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  handlers: TranscriptionUploadsRouteHandlers,
): Promise<boolean> {
  const method = req.method ?? "GET";

  if (method === "POST" && path === "/api/transcription/uploads/init") {
    await handlers.init.handle(req, res);
    return true;
  }

  if (method === "POST" && path === "/api/transcription/uploads/complete") {
    await handlers.complete.handle(req, res);
    return true;
  }

  return false;
}
