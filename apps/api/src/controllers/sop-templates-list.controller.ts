import type { IncomingMessage, ServerResponse } from "node:http";
import { ErrorCode } from "@lexos/shared/api";
import { parseQueryString } from "../lib/query-string.js";
import { sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { SopPublishedTemplatesListService } from "../services/sop-published-templates-list.service.js";

/** `GET /api/sops/templates` Controller。 */
export class SopTemplatesListController {
  constructor(
    private readonly templatesListService: SopPublishedTemplatesListService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const ctx = requireRequestContext();
    if (!ctx.auth || !ctx.accessToken) {
      throw new AppHttpError(ErrorCode.AUTH_UNAUTHORIZED, "Authentication required");
    }

    const queryParams = parseQueryString(req.url);
    const data = await this.templatesListService.list(ctx.auth, ctx.accessToken, {
      limit: queryParams.limit,
      cursor: queryParams.cursor,
    });

    sendJsonSuccess(res, 200, data, this.requestIdHeader);
  }
}
