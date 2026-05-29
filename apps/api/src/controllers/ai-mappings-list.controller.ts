import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJsonSuccess } from "../lib/http.js";
import type { AiFeatureMappingListService } from "../services/ai-feature-mapping-list.service.js";

/** `GET /api/admin/ai/mappings` Controller。 */
export class AiMappingsListController {
  constructor(
    private readonly service: AiFeatureMappingListService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(_req: IncomingMessage, res: ServerResponse): Promise<void> {
    const result = await this.service.list();
    sendJsonSuccess(res, 200, result, this.requestIdHeader);
  }
}
