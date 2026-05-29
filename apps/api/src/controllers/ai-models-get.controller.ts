import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJsonSuccess } from "../lib/http.js";
import type { AiModelGetService } from "../services/ai-model-get.service.js";

/** `GET /api/admin/ai/models/:id` Controller。 */
export class AiModelsGetController {
  constructor(
    private readonly service: AiModelGetService,
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
