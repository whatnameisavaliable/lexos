import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { ErrorCode } from "@lexos/shared/api";
import { readJsonBody, sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { AuthMfaService } from "../services/auth-mfa.service.js";

const mfaVerifyBodySchema = z.object({
  factorId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/),
});

/** `POST /api/auth/mfa/verify` Controller。 */
export class AuthMfaVerifyController {
  constructor(
    private readonly authMfaService: AuthMfaService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const ctx = requireRequestContext();
    if (!ctx.auth || !ctx.accessToken) {
      throw new Error("Auth context required");
    }

    let body;
    try {
      body = mfaVerifyBodySchema.parse((await readJsonBody(req)) ?? {});
    } catch {
      throw new AppHttpError(ErrorCode.VALIDATION_FAILED, "Invalid MFA verify payload");
    }

    await this.authMfaService.verify(
      ctx.auth,
      ctx.accessToken,
      body.factorId,
      body.code,
    );

    sendJsonSuccess(res, 200, { ok: true }, this.requestIdHeader);
  }
}
