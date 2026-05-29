import type { IncomingMessage, ServerResponse } from "node:http";
import { parseTranscriptionUploadCompleteBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { readJsonBody, sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { TranscriptionUploadCompleteService } from "../services/transcription-upload-complete.service.js";

/** `POST /api/transcription/uploads/complete` Controller。 */
export class TranscriptionUploadsCompleteController {
  constructor(
    private readonly uploadCompleteService: TranscriptionUploadCompleteService,
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
      body = parseTranscriptionUploadCompleteBody(raw ?? {});
    } catch {
      throw new AppHttpError(
        ErrorCode.VALIDATION_FAILED,
        "Invalid upload complete payload",
      );
    }

    const data = await this.uploadCompleteService.complete(
      ctx.auth,
      ctx.accessToken,
      body,
    );

    sendJsonSuccess(res, 200, data, this.requestIdHeader);
  }
}
