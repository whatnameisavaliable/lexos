import type { IncomingMessage, ServerResponse } from "node:http";
import { parseAdminUserStatusBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { getClientIp, getUserAgent, readJsonBody, sendJsonSuccess } from "../lib/http.js";
import { requireRequestContext } from "../middleware/request-context.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AdminUserStatusService } from "../services/admin-user-status.service.js";

/** `PATCH /api/admin/users/:id/status` Controller。 */
export class AdminUsersStatusController {
  constructor(
    private readonly adminUserStatusService: AdminUserStatusService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(
    req: IncomingMessage,
    res: ServerResponse,
    params: { readonly id: string },
  ): Promise<void> {
    const ctx = requireRequestContext();
    const raw = await readJsonBody<unknown>(req);
    let body;
    try {
      body = parseAdminUserStatusBody(raw ?? {});
    } catch {
      throw new AppHttpError(
        ErrorCode.VALIDATION_FAILED,
        "Invalid status payload",
      );
    }

    const result = await this.adminUserStatusService.setStatus(
      ctx.auth,
      params.id,
      body,
      { ip: getClientIp(req), userAgent: getUserAgent(req) },
    );

    sendJsonSuccess(res, 200, result, this.requestIdHeader);
  }
}
