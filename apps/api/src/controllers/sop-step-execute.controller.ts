import type { IncomingMessage, ServerResponse } from "node:http";
import { parseSopStepExecuteBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { readJsonBody, sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { SopStepExecuteService } from "../services/sop-step-execute.service.js";

/** `POST /api/sops/pipelines/:id/steps/:code/execute` Controller。 */
export class SopStepExecuteController {
  constructor(
    private readonly stepExecuteService: SopStepExecuteService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(
    req: IncomingMessage,
    res: ServerResponse,
    params: { id: string; code: string },
  ): Promise<void> {
    const ctx = requireRequestContext();
    if (!ctx.auth || !ctx.accessToken) {
      throw new AppHttpError(ErrorCode.AUTH_UNAUTHORIZED, "Authentication required");
    }

    const raw = await readJsonBody<unknown>(req);
    let body;
    try {
      body = parseSopStepExecuteBody(raw ?? {});
    } catch {
      throw new AppHttpError(ErrorCode.VALIDATION_FAILED, "Invalid step execute payload");
    }

    const result = await this.stepExecuteService.execute(
      ctx.auth,
      ctx.accessToken,
      params.id,
      params.code,
      body,
    );

    sendJsonSuccess(res, result.statusCode, result.data, this.requestIdHeader);
  }
}
