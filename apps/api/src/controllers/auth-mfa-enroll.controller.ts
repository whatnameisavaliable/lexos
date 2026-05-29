import type { ServerResponse } from "node:http";
import { requireRequestContext } from "../middleware/request-context.js";
import { sendJsonSuccess } from "../lib/http.js";
import type { AuthMfaService } from "../services/auth-mfa.service.js";

/** `POST /api/auth/mfa/enroll` Controller（admin/director）。 */
export class AuthMfaEnrollController {
  constructor(
    private readonly authMfaService: AuthMfaService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(_req: import("node:http").IncomingMessage, res: ServerResponse): Promise<void> {
    const ctx = requireRequestContext();
    if (!ctx.auth || !ctx.accessToken) {
      throw new Error("Auth context required");
    }

    const enroll = await this.authMfaService.enroll(ctx.auth, ctx.accessToken);
    sendJsonSuccess(res, 200, enroll, this.requestIdHeader);
  }
}
