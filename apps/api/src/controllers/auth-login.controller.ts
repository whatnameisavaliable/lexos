import type { IncomingMessage, ServerResponse } from "node:http";
import { parseAuthLoginBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { getClientIp, getUserAgent, readJsonBody, sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AuthLoginService } from "../services/auth-login.service.js";

/**
 * `POST /api/auth/login` Controller。
 */
export class AuthLoginController {
  constructor(
    private readonly authLoginService: AuthLoginService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const raw = await readJsonBody<unknown>(req);
    let body;
    try {
      body = parseAuthLoginBody(raw ?? {});
    } catch {
      throw new AppHttpError(ErrorCode.VALIDATION_FAILED, "Invalid login payload");
    }

    const result = await this.authLoginService.login(body, {
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    sendJsonSuccess(res, 200, result, this.requestIdHeader);
  }
}
