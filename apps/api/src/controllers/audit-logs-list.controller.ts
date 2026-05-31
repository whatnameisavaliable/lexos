import type { IncomingMessage, ServerResponse } from "node:http";
import { parseAuditLogsQuery } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { parseQueryString } from "../lib/query-string.js";
import { sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { AuditLogListService } from "../services/audit-log-list.service.js";

/** `GET /api/admin/audit/logs` Controller。 */
export class AuditLogsListController {
  constructor(
    private readonly auditLogListService: AuditLogListService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const ctx = requireRequestContext();
    if (!ctx.accessToken) {
      throw new AppHttpError(ErrorCode.AUTH_UNAUTHORIZED, "Authentication required");
    }

    let query;
    try {
      query = parseAuditLogsQuery(parseQueryString(req.url));
    } catch {
      throw new AppHttpError(ErrorCode.VALIDATION_FAILED, "Invalid audit logs query");
    }

    const result = await this.auditLogListService.list(ctx.accessToken, query);
    sendJsonSuccess(res, 200, result, this.requestIdHeader);
  }
}
