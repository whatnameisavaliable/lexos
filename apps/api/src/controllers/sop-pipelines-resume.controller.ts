import type { IncomingMessage, ServerResponse } from "node:http";
import { ErrorCode } from "@lexos/shared/api";
import { sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { SopPipelineResumeService } from "../services/sop-pipeline-resume.service.js";

/** `POST /api/sops/pipelines/:id/resume` Controller。 */
export class SopPipelinesResumeController {
  constructor(
    private readonly pipelineResumeService: SopPipelineResumeService,
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

    const data = await this.pipelineResumeService.resume(
      ctx.auth,
      ctx.accessToken,
      params.id,
    );
    sendJsonSuccess(res, 200, data, this.requestIdHeader);
  }
}
