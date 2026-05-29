import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJsonSuccess } from "../lib/http.js";
import type { AiPromptGetService } from "../services/ai-prompt-get.service.js";

/** `GET /api/admin/ai/prompts/:id` Controller。 */
export class AiPromptsGetController {
  constructor(
    private readonly service: AiPromptGetService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(
    _req: IncomingMessage,
    res: ServerResponse,
    params: { readonly id: string },
  ): Promise<void> {
    const result = await this.service.getById(params.id);
    sendJsonSuccess(res, 200, result, this.requestIdHeader);
  }
}
