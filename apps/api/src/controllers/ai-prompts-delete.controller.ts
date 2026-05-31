import type { IncomingMessage, ServerResponse } from "node:http";
import { requireRequestContext } from "../middleware/request-context.js";
import { sendJsonSuccess } from "../lib/http.js";
import type { AiPromptDeleteService } from "../services/ai-prompt-delete.service.js";

/** `DELETE /api/admin/ai/prompts/:id` Controller。 */
export class AiPromptsDeleteController {
  constructor(
    private readonly service: AiPromptDeleteService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(
    _req: IncomingMessage,
    res: ServerResponse,
    params: { readonly id: string },
  ): Promise<void> {
    const ctx = requireRequestContext();
    await this.service.delete(ctx.auth, params.id);
    sendJsonSuccess(res, 204, null, this.requestIdHeader);
  }
}
