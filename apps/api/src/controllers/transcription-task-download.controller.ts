import type { IncomingMessage, ServerResponse } from "node:http";
import { ErrorCode } from "@lexos/shared/api";
import { getClientIp, getUserAgent, sendJsonSuccess } from "../lib/http.js";
import { parseQueryString } from "../lib/query-string.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type {
  TranscriptionDownloadType,
  TranscriptionTaskDownloadService,
} from "../services/transcription-task-download.service.js";

/** `GET /api/transcription/tasks/:id/download` Controller。 */
export class TranscriptionTaskDownloadController {
  constructor(
    private readonly downloadService: TranscriptionTaskDownloadService,
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

    const type = parseDownloadType(parseQueryString(req.url).type);

    const data = await this.downloadService.download(
      ctx.auth,
      ctx.accessToken,
      params.id,
      type,
      { ip: getClientIp(req), userAgent: getUserAgent(req) },
    );

    sendJsonSuccess(res, 200, data, this.requestIdHeader);
  }
}

function parseDownloadType(raw: string | undefined): TranscriptionDownloadType {
  if (raw === "audio" || raw === "source") {
    return raw;
  }
  throw new AppHttpError(
    ErrorCode.VALIDATION_FAILED,
    "Query type must be audio or source",
  );
}
