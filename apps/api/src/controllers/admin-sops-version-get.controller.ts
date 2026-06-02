import type { IncomingMessage, ServerResponse } from "node:http";
import { sendJsonSuccess } from "../lib/http.js";
import type { AdminSopVersionGetService } from "../services/admin-sop-version-get.service.js";

/** `GET /api/admin/sops/template-versions/:version_id` Controller。 */
export class AdminSopsVersionGetController {
  constructor(
    private readonly service: AdminSopVersionGetService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(
    _req: IncomingMessage,
    res: ServerResponse,
    params: { version_id: string },
  ): Promise<void> {
    const result = await this.service.getVersion(params.version_id);
    sendJsonSuccess(res, 200, result, this.requestIdHeader);
  }
}
