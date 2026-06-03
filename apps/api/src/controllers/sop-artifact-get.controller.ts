import type { IncomingMessage, ServerResponse } from "node:http";
import { ErrorCode } from "@lexos/shared/api";
import { sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { SopArtifactGetService } from "../services/sop-artifact-get.service.js";

/** `GET /api/sops/artifacts/:id` Controller。 */
export class SopArtifactGetController {
  constructor(
    private readonly artifactGetService: SopArtifactGetService,
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

    const data = await this.artifactGetService.get(ctx.auth, ctx.accessToken, params.id);
    res.setHeader("ETag", String(data.version));
    sendJsonSuccess(res, 200, data, this.requestIdHeader);
  }
}
