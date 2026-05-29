import type { IncomingMessage, ServerResponse } from "node:http";
import { parseProfileUpdateBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { readJsonBody, sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { ProfileService } from "../services/profile.service.js";

/** `PATCH /api/profile` Controller。 */
export class ProfilePatchController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const ctx = requireRequestContext();
    if (!ctx.auth || !ctx.accessToken) {
      throw new Error("Auth context required");
    }

    let body;
    try {
      body = parseProfileUpdateBody((await readJsonBody(req)) ?? {});
    } catch {
      throw new AppHttpError(
        ErrorCode.VALIDATION_FAILED,
        "Invalid profile update payload",
      );
    }

    const profile = await this.profileService.updateProfile(
      ctx.accessToken,
      ctx.auth,
      body,
    );

    sendJsonSuccess(res, 200, profile, this.requestIdHeader);
  }
}
