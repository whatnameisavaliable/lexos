import type { ServerResponse } from "node:http";
import { requireRequestContext } from "../middleware/request-context.js";
import { getClientIp, getUserAgent, sendJsonSuccess } from "../lib/http.js";
import type { IncomingMessage } from "node:http";
import type { AuthLogoutService } from "../services/auth-logout.service.js";

/** `POST /api/auth/logout` Controller。 */
export class AuthLogoutController {
  constructor(
    private readonly authLogoutService: AuthLogoutService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(_req: IncomingMessage, res: ServerResponse): Promise<void> {
    const ctx = requireRequestContext();
    if (!ctx.auth || !ctx.accessToken) {
      throw new Error("Auth context required");
    }

    await this.authLogoutService.logout(ctx.auth, ctx.accessToken, {
      ip: getClientIp(_req),
      userAgent: getUserAgent(_req),
    });

    sendJsonSuccess(res, 200, { ok: true }, this.requestIdHeader);
  }
}
