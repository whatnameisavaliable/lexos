import type { IncomingMessage, ServerResponse } from "node:http";
import { parseSopPipelineCreateBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { readJsonBody, sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { SopPipelineCreateService } from "../services/sop-pipeline-create.service.js";

/** `POST /api/sops/pipelines` Controller。 */
export class SopPipelinesCreateController {
  constructor(
    private readonly pipelineCreateService: SopPipelineCreateService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const ctx = requireRequestContext();
    if (!ctx.auth || !ctx.accessToken) {
      throw new AppHttpError(ErrorCode.AUTH_UNAUTHORIZED, "Authentication required");
    }

    const raw = await readJsonBody<unknown>(req);
    let body;
    try {
      body = parseSopPipelineCreateBody(raw ?? {});
    } catch {
      throw new AppHttpError(ErrorCode.VALIDATION_FAILED, "Invalid pipeline create payload");
    }

    const data = await this.pipelineCreateService.create(ctx.auth, ctx.accessToken, body);
    sendJsonSuccess(res, 201, data, this.requestIdHeader);
  }
}
