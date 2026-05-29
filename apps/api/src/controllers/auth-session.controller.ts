import type { ServerResponse } from "node:http";
import { requireRequestContext } from "../middleware/request-context.js";
import { sendJsonSuccess } from "../lib/http.js";
import type { AuthSessionService } from "../services/auth-session.service.js";

/** `GET /api/auth/session` Controller。 */
export class AuthSessionController {
  constructor(
    private readonly authSessionService: AuthSessionService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(_req: import("node:http").IncomingMessage, res: ServerResponse): Promise<void> {
    const ctx = requireRequestContext();
    if (!ctx.auth || !ctx.profile) {
      throw new Error("Auth context required");
    }

    const session = this.authSessionService.buildSession(ctx.auth, ctx.profile);
    sendJsonSuccess(res, 200, session, this.requestIdHeader);
  }
}
