import type { IncomingMessage, ServerResponse } from "node:http";
import { parseTranscriptionTaskRetryBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { readJsonBody, sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { TranscriptionTaskRetryService } from "../services/transcription-task-retry.service.js";

/** `POST /api/transcription/tasks/:id/retry` Controller。 */
export class TranscriptionTasksRetryController {
  constructor(
    private readonly retryService: TranscriptionTaskRetryService,
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

    const body = parseTranscriptionTaskRetryBody(await readJsonBody(req));
    const data = await this.retryService.retry(
      ctx.auth,
      ctx.accessToken,
      params.id,
      body,
    );

    sendJsonSuccess(res, 202, data, this.requestIdHeader);
  }
}
