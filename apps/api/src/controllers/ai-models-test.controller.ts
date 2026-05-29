import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJsonSuccess } from "../lib/http.js";
import type { AiModelHealthcheckService } from "../services/ai-model-healthcheck.service.js";

/** `POST /api/admin/ai/models/:id/test` Controller（PRD AI-01）。 */
export class AiModelsTestController {
  constructor(
    private readonly service: AiModelHealthcheckService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(
    _req: IncomingMessage,
    res: ServerResponse,
    params: { readonly id: string },
  ): Promise<void> {
    const result = await this.service.test(params.id);
    sendJsonSuccess(res, 200, result, this.requestIdHeader);
  }
}
