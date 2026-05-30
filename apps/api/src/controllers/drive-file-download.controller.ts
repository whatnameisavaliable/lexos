import type { IncomingMessage, ServerResponse } from "node:http";
import { ErrorCode } from "@lexos/shared/api";
import { getClientIp, getUserAgent, sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { DriveFileDownloadService } from "../services/drive-file-download.service.js";

/** `GET /api/drive/files/:id/download` Controller。 */
export class DriveFileDownloadController {
  constructor(
    private readonly driveFileDownloadService: DriveFileDownloadService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(
    req: IncomingMessage,
    res: ServerResponse,
    params: { id: string },
  ): Promise<void> {
    const ctx = requireRequestContext();
    if (!ctx.auth || !ctx.accessToken) {
      throw new AppHttpError(ErrorCode.AUTH_UNAUTHORIZED, "Authentication required");
    }

    const data = await this.driveFileDownloadService.download(
      ctx.auth,
      ctx.accessToken,
      params.id,
      { ip: getClientIp(req), userAgent: getUserAgent(req) },
    );
    sendJsonSuccess(res, 200, data, this.requestIdHeader);
  }
}
