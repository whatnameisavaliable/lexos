import type { ServerResponse } from "node:http";
import { requireRequestContext } from "../middleware/request-context.js";
import { sendJsonSuccess } from "../lib/http.js";
import type { AuthMfaService } from "../services/auth-mfa.service.js";

/** `GET /api/auth/mfa/status` Controller。 */
export class AuthMfaStatusController {
  constructor(
    private readonly authMfaService: AuthMfaService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(_req: import("node:http").IncomingMessage, res: ServerResponse): Promise<void> {
    const ctx = requireRequestContext();
    if (!ctx.auth || !ctx.accessToken || !ctx.profile) {
      throw new Error("Auth context required");
    }

    const status = await this.authMfaService.getStatus(
      ctx.auth,
      ctx.accessToken,
      ctx.profile,
    );
    sendJsonSuccess(res, 200, status, this.requestIdHeader);
  }
}
