import type { IncomingMessage, ServerResponse } from "node:http";
import { ErrorCode } from "@lexos/shared/api";
import { getClientIp, getUserAgent, sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { DriveNodeDeleteService } from "../services/drive-node-delete.service.js";

/** `DELETE /api/drive/nodes/:id` Controller。 */
export class DriveNodeDeleteController {
  constructor(
    private readonly driveNodeDeleteService: DriveNodeDeleteService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(
    req: IncomingMessage,
    res: ServerResponse,
    params: { id: string },
  ): Promise<void> {
    const ctx = requireRequestContext();
    if (!ctx.auth || !ctx.accessToken) {
      throw new AppHttpError(ErrorCode.AUTH_UNAUTHORIZED, "Authentication required");
    }

    const data = await this.driveNodeDeleteService.delete(
      ctx.auth,
      ctx.accessToken,
      params.id,
      { ip: getClientIp(req), userAgent: getUserAgent(req) },
    );
    sendJsonSuccess(res, 200, data, this.requestIdHeader);
  }
}
