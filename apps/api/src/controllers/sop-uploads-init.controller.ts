import type { IncomingMessage, ServerResponse } from "node:http";
import { parseSopUploadInitBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { readJsonBody, sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { SopUploadInitService } from "../services/sop-upload-init.service.js";

/** `POST /api/sops/uploads/init` Controller。 */
export class SopUploadsInitController {
  constructor(
    private readonly uploadInitService: SopUploadInitService,
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
      body = parseSopUploadInitBody(raw ?? {});
    } catch {
      throw new AppHttpError(ErrorCode.VALIDATION_FAILED, "Invalid SOP upload init payload");
    }

    const data = await this.uploadInitService.init(ctx.auth, ctx.accessToken, body);
    sendJsonSuccess(res, 200, data, this.requestIdHeader);
  }
}
