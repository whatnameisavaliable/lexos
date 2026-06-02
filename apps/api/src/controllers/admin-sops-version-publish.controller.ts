import type { IncomingMessage, ServerResponse } from "node:http";
import { getClientIp, getUserAgent, sendJsonSuccess } from "../lib/http.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { AdminSopVersionPublishService } from "../services/admin-sop-version-publish.service.js";

/** `POST /api/admin/sops/template-versions/:version_id/publish` Controller。 */
export class AdminSopsVersionPublishController {
  constructor(
    private readonly service: AdminSopVersionPublishService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(
    req: IncomingMessage,
    res: ServerResponse,
    params: { version_id: string },
  ): Promise<void> {
    const ctx = requireRequestContext();
    const result = await this.service.publish(ctx.auth, params.version_id, {
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
    });
    sendJsonSuccess(res, 200, result, this.requestIdHeader);
  }
}
