import type { IncomingMessage, ServerResponse } from "node:http";
import { ErrorCode } from "@lexos/shared/api";
import { sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { AuditLogGetService } from "../services/audit-log-get.service.js";

/** `GET /api/admin/audit/logs/:id` Controller。 */
export class AuditLogGetController {
  constructor(
    private readonly auditLogGetService: AuditLogGetService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(
    _req: IncomingMessage,
    res: ServerResponse,
    params: { readonly id: string },
  ): Promise<void> {
    const ctx = requireRequestContext();
    if (!ctx.accessToken) {
      throw new AppHttpError(ErrorCode.AUTH_UNAUTHORIZED, "Authentication required");
    }

    const item = await this.auditLogGetService.get(ctx.accessToken, params.id);
    sendJsonSuccess(res, 200, item, this.requestIdHeader);
  }
}
