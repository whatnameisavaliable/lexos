import type { IncomingMessage, ServerResponse } from "node:http";
import { parseAdminSopCreateVersionBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { readJsonBody, sendJsonSuccess } from "../lib/http.js";
import { requireRequestContext } from "../middleware/request-context.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AdminSopVersionCreateService } from "../services/admin-sop-version-create.service.js";

/** `POST /api/admin/sops/templates/:template_id/versions` Controller。 */
export class AdminSopsVersionCreateController {
  constructor(
    private readonly service: AdminSopVersionCreateService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(
    req: IncomingMessage,
    res: ServerResponse,
    params: { template_id: string },
  ): Promise<void> {
    const ctx = requireRequestContext();
    const raw = await readJsonBody<unknown>(req);
    let body;
    try {
      body = parseAdminSopCreateVersionBody(raw ?? {});
    } catch {
      throw new AppHttpError(
        ErrorCode.VALIDATION_FAILED,
        "Invalid create version payload",
      );
    }

    const result = await this.service.create(ctx.auth, params.template_id, body);
    sendJsonSuccess(res, 201, result, this.requestIdHeader);
  }
}
