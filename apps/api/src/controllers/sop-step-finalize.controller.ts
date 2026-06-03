import type { IncomingMessage, ServerResponse } from "node:http";
import { ErrorCode } from "@lexos/shared/api";
import { sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { SopStepFinalizeService } from "../services/sop-step-finalize.service.js";

/** `POST /api/sops/pipelines/:id/steps/:code/finalize` Controller。 */
export class SopStepFinalizeController {
  constructor(
    private readonly stepFinalizeService: SopStepFinalizeService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(
    _req: IncomingMessage,
    res: ServerResponse,
    params: { id: string; code: string },
  ): Promise<void> {
    const ctx = requireRequestContext();
    if (!ctx.auth || !ctx.accessToken) {
      throw new AppHttpError(ErrorCode.AUTH_UNAUTHORIZED, "Authentication required");
    }

    const data = await this.stepFinalizeService.finalize(
      ctx.auth,
      ctx.accessToken,
      params.id,
      params.code,
    );
    sendJsonSuccess(res, 200, data, this.requestIdHeader);
  }
}
