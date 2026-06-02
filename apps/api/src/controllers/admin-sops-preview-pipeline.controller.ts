import type { IncomingMessage, ServerResponse } from "node:http";
import { parseAdminSopPreviewPipelineBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { readJsonBody, sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AdminSopPreviewPipelineService } from "../services/admin-sop-preview-pipeline.service.js";

/** `POST /api/admin/sops/preview-pipeline` Controller。 */
export class AdminSopsPreviewPipelineController {
  constructor(
    private readonly service: AdminSopPreviewPipelineService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const raw = await readJsonBody<unknown>(req);
    let body;
    try {
      body = parseAdminSopPreviewPipelineBody(raw ?? {});
    } catch {
      throw new AppHttpError(
        ErrorCode.VALIDATION_FAILED,
        "Invalid preview-pipeline payload",
      );
    }

    const result = await this.service.preview(body);
    sendJsonSuccess(res, 200, result, this.requestIdHeader);
  }
}
