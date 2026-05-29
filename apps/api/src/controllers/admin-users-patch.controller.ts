import type { IncomingMessage, ServerResponse } from "node:http";
import { parseAdminUserUpdateBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { getClientIp, getUserAgent, readJsonBody, sendJsonSuccess } from "../lib/http.js";
import { requireRequestContext } from "../middleware/request-context.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AdminUserUpdateService } from "../services/admin-user-update.service.js";

/** `PATCH /api/admin/users/:id` Controller。 */
export class AdminUsersPatchController {
  constructor(
    private readonly adminUserUpdateService: AdminUserUpdateService,
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
      body = parseAdminUserUpdateBody(raw ?? {});
    } catch {
      throw new AppHttpError(
        ErrorCode.VALIDATION_FAILED,
        "Invalid update user payload",
      );
    }

    const result = await this.adminUserUpdateService.update(
      ctx.auth,
      params.id,
      body,
      { ip: getClientIp(req), userAgent: getUserAgent(req) },
    );

    sendJsonSuccess(res, 200, result, this.requestIdHeader);
  }
}
