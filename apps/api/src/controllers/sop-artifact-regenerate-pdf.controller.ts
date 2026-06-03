import type { IncomingMessage, ServerResponse } from "node:http";
import { ErrorCode } from "@lexos/shared/api";
import { sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { SopArtifactRegeneratePdfService } from "../services/sop-artifact-regenerate-pdf.service.js";

/** `POST /api/sops/artifacts/:id/regenerate-pdf` Controller。 */
export class SopArtifactRegeneratePdfController {
  constructor(
    private readonly regeneratePdfService: SopArtifactRegeneratePdfService,
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

    const data = await this.regeneratePdfService.regenerate(
      ctx.auth,
      ctx.accessToken,
      params.id,
    );
    sendJsonSuccess(res, 202, data, this.requestIdHeader);
  }
}
