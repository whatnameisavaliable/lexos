import type { IncomingMessage, ServerResponse } from "node:http";
import { parseAuthRefreshBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { readJsonBody, sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AuthRefreshService } from "../services/auth-refresh.service.js";

/** `POST /api/auth/refresh` Controller。 */
export class AuthRefreshController {
  constructor(
    private readonly authRefreshService: AuthRefreshService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const raw = await readJsonBody<unknown>(req);
    let body;
    try {
      body = parseAuthRefreshBody(raw ?? {});
    } catch {
      throw new AppHttpError(ErrorCode.VALIDATION_FAILED, "Invalid refresh payload");
    }

    const result = await this.authRefreshService.refresh(body);
    sendJsonSuccess(res, 200, result, this.requestIdHeader);
  }
}
