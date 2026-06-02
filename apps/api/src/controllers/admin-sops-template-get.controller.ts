import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJsonSuccess } from "../lib/http.js";
import type { AdminSopTemplateGetService } from "../services/admin-sop-template-get.service.js";

/** `GET /api/admin/sops/templates/:template_id` Controller。 */
export class AdminSopsTemplateGetController {
  constructor(
    private readonly service: AdminSopTemplateGetService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(
    _req: IncomingMessage,
    res: ServerResponse,
    params: { template_id: string },
  ): Promise<void> {
    const result = await this.service.getTemplate(params.template_id);
    sendJsonSuccess(res, 200, result, this.requestIdHeader);
  }
}
