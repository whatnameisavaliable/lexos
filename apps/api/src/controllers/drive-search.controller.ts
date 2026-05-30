import type { IncomingMessage, ServerResponse } from "node:http";
import { parseDriveSearchQuery } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { parseQueryString } from "../lib/query-string.js";
import { sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { DriveSearchService } from "../services/drive-search.service.js";

/** `GET /api/drive/search` Controller。 */
export class DriveSearchController {
  constructor(
    private readonly driveSearchService: DriveSearchService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const ctx = requireRequestContext();
    if (!ctx.auth) {
      throw new AppHttpError(ErrorCode.AUTH_UNAUTHORIZED, "Authentication required");
    }

    let query;
    try {
      query = parseDriveSearchQuery(parseQueryString(req.url));
    } catch {
      throw new AppHttpError(ErrorCode.VALIDATION_FAILED, "Invalid search query");
    }

    const data = await this.driveSearchService.search(ctx.auth, query);
    sendJsonSuccess(res, 200, data, this.requestIdHeader);
  }
}
