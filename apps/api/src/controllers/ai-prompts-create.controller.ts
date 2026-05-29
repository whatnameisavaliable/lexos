import type { IncomingMessage, ServerResponse } from "node:http";
import { parseAiPromptCreateBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { readJsonBody, sendJsonSuccess } from "../lib/http.js";
import { requireRequestContext } from "../middleware/request-context.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AiPromptCreateService } from "../services/ai-prompt-create.service.js";

/** `POST /api/admin/ai/prompts` Controller。 */
export class AiPromptsCreateController {
  constructor(
    private readonly service: AiPromptCreateService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const ctx = requireRequestContext();
    const raw = await readJsonBody<unknown>(req);
    let body;
    try {
      body = parseAiPromptCreateBody(raw ?? {});
    } catch {
      throw new AppHttpError(
        ErrorCode.VALIDATION_FAILED,
        "Invalid create prompt payload",
      );
    }

    const result = await this.service.create(ctx.auth, body);
    sendJsonSuccess(res, 201, result, this.requestIdHeader);
  }
}
