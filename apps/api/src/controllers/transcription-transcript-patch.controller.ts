import type { IncomingMessage, ServerResponse } from "node:http";
import {
  parseTranscriptIfMatchHeader,
  parseTranscriptPatchBody,
} from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { readJsonBody, sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { TranscriptionTranscriptPatchService } from "../services/transcription-transcript-patch.service.js";

/** `PATCH /api/transcription/tasks/:id/transcript` Controller。 */
export class TranscriptionTranscriptPatchController {
  constructor(
    private readonly transcriptPatchService: TranscriptionTranscriptPatchService,
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

    let body;
    try {
      body = parseTranscriptPatchBody((await readJsonBody(req)) ?? {});
    } catch {
      throw new AppHttpError(
        ErrorCode.VALIDATION_FAILED,
        "Invalid transcript patch payload",
      );
    }

    let expectedVersion: number;
    try {
      expectedVersion = parseTranscriptIfMatchHeader(req.headers["if-match"]);
    } catch {
      throw new AppHttpError(
        ErrorCode.VALIDATION_FAILED,
        "If-Match header must be a positive integer version",
      );
    }

    const data = await this.transcriptPatchService.patch(
      ctx.auth,
      ctx.accessToken,
      params.id,
      body,
      expectedVersion,
    );

    res.setHeader("ETag", String(data.version));
    sendJsonSuccess(res, 200, data, this.requestIdHeader);
  }
}
