import type { IncomingMessage, ServerResponse } from "node:http";
import { parseAiPromptUpdateBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { readJsonBody, sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AiPromptUpdateService } from "../services/ai-prompt-update.service.js";

/** `PATCH /api/admin/ai/prompts/:id` Controller。 */
export class AiPromptsPatchController {
  constructor(
    private readonly service: AiPromptUpdateService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(
    req: IncomingMessage,
    res: ServerResponse,
    params: { readonly id: string },
  ): Promise<void> {
    const raw = await readJsonBody<unknown>(req);
    let body;
    try {
      body = parseAiPromptUpdateBody(raw ?? {});
    } catch {
      throw new AppHttpError(
        ErrorCode.VALIDATION_FAILED,
        "Invalid update prompt payload",
      );
    }

    const result = await this.service.update(params.id, body);
    sendJsonSuccess(res, 200, result, this.requestIdHeader);
  }
}
