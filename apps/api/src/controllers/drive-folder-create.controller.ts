import type { IncomingMessage, ServerResponse } from "node:http";
import { parseDriveFolderCreateBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { getClientIp, getUserAgent, readJsonBody, sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { DriveFolderCreateService } from "../services/drive-folder-create.service.js";

/** `POST /api/drive/folders` Controller。 */
export class DriveFolderCreateController {
  constructor(
    private readonly driveFolderCreateService: DriveFolderCreateService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const ctx = requireRequestContext();
    if (!ctx.auth || !ctx.accessToken) {
      throw new AppHttpError(ErrorCode.AUTH_UNAUTHORIZED, "Authentication required");
    }

    const raw = await readJsonBody<unknown>(req);
    let body;
    try {
      body = parseDriveFolderCreateBody(raw ?? {});
    } catch {
      throw new AppHttpError(ErrorCode.VALIDATION_FAILED, "Invalid folder payload");
    }

    const data = await this.driveFolderCreateService.create(
      ctx.auth,
      ctx.accessToken,
      body,
    );
    sendJsonSuccess(res, 201, data, this.requestIdHeader);
  }
}
