import type { IncomingMessage, ServerResponse } from "node:http";
import { parseTranscriptionTaskListQuery } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { parseQueryString } from "../lib/query-string.js";
import { sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { TranscriptionTaskListService } from "../services/transcription-task-list.service.js";

/** `GET /api/transcription/tasks` Controller。 */
export class TranscriptionTasksListController {
  constructor(
    private readonly taskListService: TranscriptionTaskListService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const ctx = requireRequestContext();
    if (!ctx.auth || !ctx.accessToken) {
      throw new AppHttpError(ErrorCode.AUTH_UNAUTHORIZED, "Authentication required");
    }

    let query;
    try {
      query = parseTranscriptionTaskListQuery(parseQueryString(req.url));
    } catch {
      throw new AppHttpError(ErrorCode.VALIDATION_FAILED, "Invalid list query");
    }

    const data = await this.taskListService.list(
      ctx.auth,
      ctx.accessToken,
      query,
    );

    sendJsonSuccess(res, 200, data, this.requestIdHeader);
  }
}
