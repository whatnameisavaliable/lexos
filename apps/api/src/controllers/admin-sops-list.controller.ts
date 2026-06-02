import type { IncomingMessage, ServerResponse } from "node:http";
import { parseQueryString } from "../lib/query-string.js";
import { sendJsonSuccess } from "../lib/http.js";
import type { AdminSopListService } from "../services/admin-sop-list.service.js";

/** `GET /api/admin/sops` Controller。 */
export class AdminSopsListController {
  constructor(
    private readonly service: AdminSopListService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const queryParams = parseQueryString(req.url);
    const limitRaw = queryParams.limit;
    const limit =
      limitRaw !== undefined ? Number.parseInt(limitRaw, 10) : undefined;
    const cursor = queryParams.cursor;

    const result = await this.service.list({
      ...(Number.isFinite(limit) ? { limit } : {}),
      ...(cursor ? { cursor } : {}),
    });
    sendJsonSuccess(res, 200, result, this.requestIdHeader);
  }
}
