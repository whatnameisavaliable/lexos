import type { IncomingMessage, ServerResponse } from "node:http";
import { parseTranscriptionUploadInitBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { getClientIp, getUserAgent, readJsonBody, sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { TranscriptionUploadInitService } from "../services/transcription-upload-init.service.js";

/** `POST /api/transcription/uploads/init` Controller。 */
export class TranscriptionUploadsInitController {
  constructor(
    private readonly uploadInitService: TranscriptionUploadInitService,
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
      body = parseTranscriptionUploadInitBody(raw ?? {});
    } catch {
      throw new AppHttpError(ErrorCode.VALIDATION_FAILED, "Invalid upload init payload");
    }

    const data = await this.uploadInitService.init(
      ctx.auth,
      ctx.accessToken,
      body,
      { ip: getClientIp(req), userAgent: getUserAgent(req) },
    );

    sendJsonSuccess(res, 200, data, this.requestIdHeader);
  }
}
