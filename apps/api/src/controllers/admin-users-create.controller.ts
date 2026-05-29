import type { IncomingMessage, ServerResponse } from "node:http";
import { parseAdminUserCreateBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { getClientIp, getUserAgent, readJsonBody, sendJsonSuccess } from "../lib/http.js";
import { requireRequestContext } from "../middleware/request-context.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AdminUserCreateService } from "../services/admin-user-create.service.js";

/** `POST /api/admin/users` Controller。 */
export class AdminUsersCreateController {
  constructor(
    private readonly adminUserCreateService: AdminUserCreateService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const ctx = requireRequestContext();
    const raw = await readJsonBody<unknown>(req);
    let body;
    try {
      body = parseAdminUserCreateBody(raw ?? {});
    } catch {
      throw new AppHttpError(
        ErrorCode.VALIDATION_FAILED,
        "Invalid create user payload",
      );
    }

    const result = await this.adminUserCreateService.create(
      ctx.auth,
      body,
      { ip: getClientIp(req), userAgent: getUserAgent(req) },
    );

    sendJsonSuccess(res, 201, result, this.requestIdHeader);
  }
}
