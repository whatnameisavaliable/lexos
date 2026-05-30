import type { IncomingMessage, ServerResponse } from "node:http";
import { ErrorCode } from "@lexos/shared/api";
import { getClientIp, getUserAgent, sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { TranscriptionExportDocxService } from "../services/transcription-export-docx.service.js";

/** `POST /api/transcription/tasks/:id/export/docx` Controller。 */
export class TranscriptionTaskExportDocxController {
  constructor(
    private readonly exportService: TranscriptionExportDocxService,
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

    const data = await this.exportService.exportDocx(
      ctx.auth,
      ctx.accessToken,
      params.id,
      { ip: getClientIp(req), userAgent: getUserAgent(req) },
    );

    sendJsonSuccess(res, 200, data, this.requestIdHeader);
  }
}
