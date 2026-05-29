import type { IncomingMessage, ServerResponse } from "node:http";
import { parseAiModelUpdateBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { getClientIp, getUserAgent, readJsonBody, sendJsonSuccess } from "../lib/http.js";
import { requireRequestContext } from "../middleware/request-context.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AiModelUpdateService } from "../services/ai-model-update.service.js";

/** `PATCH /api/admin/ai/models/:id` Controller。 */
export class AiModelsPatchController {
  constructor(
    private readonly service: AiModelUpdateService,
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
      body = parseAiModelUpdateBody(raw ?? {});
    } catch {
      throw new AppHttpError(
        ErrorCode.VALIDATION_FAILED,
        "Invalid update model payload",
      );
    }

    const result = await this.service.update(ctx.auth, params.id, body, {
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
    });
    sendJsonSuccess(res, 200, result, this.requestIdHeader);
  }
}
