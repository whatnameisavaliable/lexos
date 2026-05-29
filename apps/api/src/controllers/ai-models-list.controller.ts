import type { IncomingMessage, ServerResponse } from "node:http";
import { parseAiModelListQuery } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { parseQueryString } from "../lib/query-string.js";
import { sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AiModelListService } from "../services/ai-model-list.service.js";

/** `GET /api/admin/ai/models` Controller。 */
export class AiModelsListController {
  constructor(
    private readonly service: AiModelListService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const query = parseAiModelListQuery(parseQueryString(req.url));
      const result = await this.service.list(query);
      sendJsonSuccess(res, 200, result, this.requestIdHeader);
    } catch {
      throw new AppHttpError(ErrorCode.VALIDATION_FAILED, "Invalid list query");
    }
  }
}
