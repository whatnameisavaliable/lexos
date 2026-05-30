import type { IncomingMessage, ServerResponse } from "node:http";
import { ErrorCode } from "@lexos/shared/api";
import { sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { DriveRootService } from "../services/drive-root.service.js";

/** `GET /api/drive/root` Controller。 */
export class DriveRootController {
  constructor(
    private readonly driveRootService: DriveRootService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const ctx = requireRequestContext();
    if (!ctx.auth || !ctx.accessToken) {
      throw new AppHttpError(ErrorCode.AUTH_UNAUTHORIZED, "Authentication required");
    }

    const data = await this.driveRootService.getOrCreateRoot(
      ctx.auth,
      ctx.accessToken,
    );
    sendJsonSuccess(res, 200, data, this.requestIdHeader);
  }
}
