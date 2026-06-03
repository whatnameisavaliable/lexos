import type { IncomingMessage, ServerResponse } from "node:http";
import { parseSopArtifactPatchBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { readJsonBody, sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { SopArtifactPatchService } from "../services/sop-artifact-patch.service.js";

/** `PATCH /api/sops/artifacts/:id` Controller。 */
export class SopArtifactPatchController {
  constructor(
    private readonly artifactPatchService: SopArtifactPatchService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(
    req: IncomingMessage,
    res: ServerResponse,
    params: { id: string },
  ): Promise<void> {
    const ctx = requireRequestContext();
    if (!ctx.auth || !ctx.accessToken) {
      throw new AppHttpError(ErrorCode.AUTH_UNAUTHORIZED, "Authentication required");
    }

    let body;
    try {
      body = parseSopArtifactPatchBody((await readJsonBody(req)) ?? {});
    } catch {
      throw new AppHttpError(ErrorCode.VALIDATION_FAILED, "Invalid artifact patch payload");
    }

    const ifMatch = req.headers["if-match"];
    if (typeof ifMatch !== "string" || ifMatch.trim() === "") {
      throw new AppHttpError(
        ErrorCode.VALIDATION_FAILED,
        "If-Match header must be a positive integer version",
      );
    }

    const data = await this.artifactPatchService.patch(
      ctx.auth,
      ctx.accessToken,
      params.id,
      ifMatch.trim(),
      body,
    );

    res.setHeader("ETag", String(data.version));
    sendJsonSuccess(res, 200, data, this.requestIdHeader);
  }
}
