import type { IncomingMessage, ServerResponse } from "node:http";
import { ErrorCode } from "@lexos/shared/api";
import { sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { SystemSettingsGetService } from "../services/system-settings-get.service.js";

/** `GET /api/admin/settings/:key` Controller。 */
export class SettingsGetController {
  constructor(
    private readonly systemSettingsGetService: SystemSettingsGetService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(
    _req: IncomingMessage,
    res: ServerResponse,
    params: { readonly key: string },
  ): Promise<void> {
    const ctx = requireRequestContext();
    if (!ctx.accessToken) {
      throw new AppHttpError(ErrorCode.AUTH_UNAUTHORIZED, "Authentication required");
    }

    const key = decodeURIComponent(params.key);
    const item = await this.systemSettingsGetService.get(ctx.accessToken, key);
    sendJsonSuccess(res, 200, item, this.requestIdHeader);
  }
}
