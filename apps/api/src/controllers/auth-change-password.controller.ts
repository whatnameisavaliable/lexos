import type { IncomingMessage, ServerResponse } from "node:http";
import { parseAuthChangePasswordBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { getClientIp, getUserAgent, readJsonBody, sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { AuthChangePasswordService } from "../services/auth-change-password.service.js";

/** `POST /api/auth/change-password` Controller。 */
export class AuthChangePasswordController {
  constructor(
    private readonly service: AuthChangePasswordService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const ctx = requireRequestContext();
    if (!ctx.auth || !ctx.accessToken) {
      throw new Error("Auth context required");
    }

    let body;
    try {
      body = parseAuthChangePasswordBody((await readJsonBody(req)) ?? {});
    } catch {
      throw new AppHttpError(
        ErrorCode.VALIDATION_FAILED,
        "Invalid change-password payload",
      );
    }

    const result = await this.service.changePassword(
      ctx.auth,
      ctx.accessToken,
      body,
      {
        ip: getClientIp(req),
        userAgent: getUserAgent(req),
      },
    );

    sendJsonSuccess(
      res,
      200,
      { ok: true, accessToken: result.accessToken, expiresAt: result.expiresAt },
      this.requestIdHeader,
    );
  }
}
