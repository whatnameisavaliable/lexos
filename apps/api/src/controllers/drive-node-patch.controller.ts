import type { IncomingMessage, ServerResponse } from "node:http";
import { parseDriveNodeUpdateBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { readJsonBody, sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { DriveNodeUpdateService } from "../services/drive-node-update.service.js";

/** `PATCH /api/drive/nodes/:id` Controller。 */
export class DriveNodePatchController {
  constructor(
    private readonly driveNodeUpdateService: DriveNodeUpdateService,
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

    const raw = await readJsonBody<unknown>(req);
    let body;
    try {
      body = parseDriveNodeUpdateBody(raw ?? {});
    } catch {
      throw new AppHttpError(ErrorCode.VALIDATION_FAILED, "Invalid update payload");
    }

    const data = await this.driveNodeUpdateService.update(
      ctx.auth,
      ctx.accessToken,
      params.id,
      body,
    );
    sendJsonSuccess(res, 200, data, this.requestIdHeader);
  }
}
