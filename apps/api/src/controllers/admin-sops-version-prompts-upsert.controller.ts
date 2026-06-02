import type { IncomingMessage, ServerResponse } from "node:http";
import { parseAdminSopVersionPromptsUpsertBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { getClientIp, getUserAgent, readJsonBody, sendJsonSuccess } from "../lib/http.js";
import { requireRequestContext } from "../middleware/request-context.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AdminSopVersionPromptsUpsertService } from "../services/admin-sop-version-prompts-upsert.service.js";

/** `PUT /api/admin/sops/template-versions/:version_id/prompts` Controller。 */
export class AdminSopsVersionPromptsUpsertController {
  constructor(
    private readonly service: AdminSopVersionPromptsUpsertService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(
    req: IncomingMessage,
    res: ServerResponse,
    params: { version_id: string },
  ): Promise<void> {
    const ctx = requireRequestContext();
    const raw = await readJsonBody<unknown>(req);
    let body;
    try {
      body = parseAdminSopVersionPromptsUpsertBody(raw ?? {});
    } catch {
      throw new AppHttpError(
        ErrorCode.VALIDATION_FAILED,
        "Invalid prompts upsert payload",
      );
    }

    const result = await this.service.upsert(
      ctx.auth,
      params.version_id,
      body,
      { ip: getClientIp(req), userAgent: getUserAgent(req) },
    );
    sendJsonSuccess(res, 200, result, this.requestIdHeader);
  }
}
