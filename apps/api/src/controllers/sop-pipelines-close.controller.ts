import type { IncomingMessage, ServerResponse } from "node:http";
import { ErrorCode } from "@lexos/shared/api";
import { sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { SopPipelineCloseService } from "../services/sop-pipeline-close.service.js";

/** `POST /api/sops/pipelines/:id/close` Controller。 */
export class SopPipelinesCloseController {
  constructor(
    private readonly pipelineCloseService: SopPipelineCloseService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(
    _req: IncomingMessage,
    res: ServerResponse,
    params: { id: string },
  ): Promise<void> {
    const ctx = requireRequestContext();
    if (!ctx.auth || !ctx.accessToken) {
      throw new AppHttpError(ErrorCode.AUTH_UNAUTHORIZED, "Authentication required");
    }

    const data = await this.pipelineCloseService.close(
      ctx.auth,
      ctx.accessToken,
      params.id,
    );
    sendJsonSuccess(res, 200, data, this.requestIdHeader);
  }
}
