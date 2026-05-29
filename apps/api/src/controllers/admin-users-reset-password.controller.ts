import type { IncomingMessage, ServerResponse } from "node:http";
import { getClientIp, getUserAgent, sendJsonSuccess } from "../lib/http.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { AdminUserResetPasswordService } from "../services/admin-user-reset-password.service.js";

/** `POST /api/admin/users/:id/reset-password` Controller。 */
export class AdminUsersResetPasswordController {
  constructor(
    private readonly adminUserResetPasswordService: AdminUserResetPasswordService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(
    req: IncomingMessage,
    res: ServerResponse,
    params: { readonly id: string },
  ): Promise<void> {
    const ctx = requireRequestContext();
    const result = await this.adminUserResetPasswordService.resetPassword(
      ctx.auth,
      params.id,
      { ip: getClientIp(req), userAgent: getUserAgent(req) },
    );

    sendJsonSuccess(res, 200, result, this.requestIdHeader);
  }
}
