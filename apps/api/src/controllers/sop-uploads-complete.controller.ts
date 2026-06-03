import type { IncomingMessage, ServerResponse } from "node:http";
import { parseSopUploadCompleteBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { readJsonBody, sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { SopUploadCompleteService } from "../services/sop-upload-complete.service.js";

/** `POST /api/sops/uploads/complete` Controller。 */
export class SopUploadsCompleteController {
  constructor(
    private readonly uploadCompleteService: SopUploadCompleteService,
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
      body = parseSopUploadCompleteBody(raw ?? {});
    } catch {
      throw new AppHttpError(ErrorCode.VALIDATION_FAILED, "Invalid SOP upload complete payload");
    }

    const data = await this.uploadCompleteService.complete(ctx.auth, ctx.accessToken, body);
    sendJsonSuccess(res, 200, data, this.requestIdHeader);
  }
}
