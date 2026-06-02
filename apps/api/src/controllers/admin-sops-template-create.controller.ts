import type { IncomingMessage, ServerResponse } from "node:http";
import { parseAdminSopTemplateCreateBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { readJsonBody, sendJsonSuccess } from "../lib/http.js";
import { requireRequestContext } from "../middleware/request-context.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AdminSopTemplateCreateService } from "../services/admin-sop-template-create.service.js";

/** `POST /api/admin/sops/templates` Controller。 */
export class AdminSopsTemplateCreateController {
  constructor(
    private readonly service: AdminSopTemplateCreateService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const ctx = requireRequestContext();
    const raw = await readJsonBody<unknown>(req);
    let body;
    try {
      body = parseAdminSopTemplateCreateBody(raw ?? {});
    } catch {
      throw new AppHttpError(
        ErrorCode.VALIDATION_FAILED,
        "Invalid create SOP template payload",
      );
    }

    const result = await this.service.create(ctx.auth, body);
    sendJsonSuccess(res, 201, result, this.requestIdHeader);
  }
}
