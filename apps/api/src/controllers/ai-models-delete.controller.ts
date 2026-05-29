import type { IncomingMessage, ServerResponse } from "node:http";
import { requireRequestContext } from "../middleware/request-context.js";
import { sendJsonSuccess } from "../lib/http.js";
import type { AiModelDeleteService } from "../services/ai-model-delete.service.js";

/** `DELETE /api/admin/ai/models/:id` Controller。 */
export class AiModelsDeleteController {
  constructor(
    private readonly service: AiModelDeleteService,
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
