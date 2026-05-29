import type { IncomingMessage, ServerResponse } from "node:http";
import { parseAiModelCreateBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { getClientIp, getUserAgent, readJsonBody, sendJsonSuccess } from "../lib/http.js";
import { requireRequestContext } from "../middleware/request-context.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AiModelCreateService } from "../services/ai-model-create.service.js";

/** `POST /api/admin/ai/models` Controller。 */
export class AiModelsCreateController {
  constructor(
    private readonly service: AiModelCreateService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const ctx = requireRequestContext();
    const raw = await readJsonBody<unknown>(req);
    let body;
    try {
      body = parseAiModelCreateBody(raw ?? {});
    } catch {
      throw new AppHttpError(
        ErrorCode.VALIDATION_FAILED,
        "Invalid create model payload",
      );
    }

    const result = await this.service.create(ctx.auth, body, {
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
    });
    sendJsonSuccess(res, 201, result, this.requestIdHeader);
  }
}
