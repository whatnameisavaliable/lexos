import type { IncomingMessage, ServerResponse } from "node:http";
import { getClientIp, getUserAgent, sendJsonSuccess } from "../lib/http.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { AiPromptPublishService } from "../services/ai-prompt-publish.service.js";

/** `POST /api/admin/ai/prompts/:id/publish` Controller。 */
export class AiPromptsPublishController {
  constructor(
    private readonly service: AiPromptPublishService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(
    req: IncomingMessage,
    res: ServerResponse,
    params: { readonly id: string },
  ): Promise<void> {
    const ctx = requireRequestContext();
    const result = await this.service.publish(ctx.auth, params.id, {
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
    });
    sendJsonSuccess(res, 200, result, this.requestIdHeader);
  }
}
