import type { IncomingMessage, ServerResponse } from "node:http";
import { parseAiInvocationLogsQuery } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { parseQueryString } from "../lib/query-string.js";
import { sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AiInvocationLogListService } from "../services/ai-invocation-log-list.service.js";

/** `GET /api/admin/ai/invocation-logs` Controller。 */
export class AiInvocationLogsListController {
  constructor(
    private readonly service: AiInvocationLogListService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const query = parseAiInvocationLogsQuery(parseQueryString(req.url));
      const result = await this.service.list(query);
      sendJsonSuccess(res, 200, result, this.requestIdHeader);
    } catch {
      throw new AppHttpError(ErrorCode.VALIDATION_FAILED, "Invalid logs query");
    }
  }
}
