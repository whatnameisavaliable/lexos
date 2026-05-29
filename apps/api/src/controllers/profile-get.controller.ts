import type { ServerResponse } from "node:http";
import { requireRequestContext } from "../middleware/request-context.js";
import { sendJsonSuccess } from "../lib/http.js";
import type { ProfileService } from "../services/profile.service.js";

/** `GET /api/profile` Controller。 */
export class ProfileGetController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(_req: import("node:http").IncomingMessage, res: ServerResponse): Promise<void> {
    const ctx = requireRequestContext();
    if (!ctx.profile) {
      throw new Error("Profile required");
    }

    sendJsonSuccess(
      res,
      200,
      this.profileService.getProfile(ctx.profile),
      this.requestIdHeader,
    );
  }
}
