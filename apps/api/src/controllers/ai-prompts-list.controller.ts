import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJsonSuccess } from "../lib/http.js";
import type { AiPromptListService } from "../services/ai-prompt-list.service.js";

/** `GET /api/admin/ai/prompts` Controller。 */
export class AiPromptsListController {
  constructor(
    private readonly service: AiPromptListService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(_req: IncomingMessage, res: ServerResponse): Promise<void> {
    const result = await this.service.list();
    sendJsonSuccess(res, 200, result, this.requestIdHeader);
  }
}
