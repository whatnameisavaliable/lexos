import type { IncomingMessage, ServerResponse } from "node:http";
import { parseDriveNodesListQuery } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { parseQueryString } from "../lib/query-string.js";
import { sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { DriveNodesListService } from "../services/drive-nodes-list.service.js";

/** `GET /api/drive/nodes` Controller。 */
export class DriveNodesListController {
  constructor(
    private readonly driveNodesListService: DriveNodesListService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const ctx = requireRequestContext();
    if (!ctx.auth || !ctx.accessToken) {
      throw new AppHttpError(ErrorCode.AUTH_UNAUTHORIZED, "Authentication required");
    }

    let query;
    try {
      query = parseDriveNodesListQuery(parseQueryString(req.url));
    } catch {
      throw new AppHttpError(ErrorCode.VALIDATION_FAILED, "Invalid list query");
    }

    const data = await this.driveNodesListService.list(
      ctx.auth,
      ctx.accessToken,
      query,
    );
    sendJsonSuccess(res, 200, data, this.requestIdHeader);
  }
}
