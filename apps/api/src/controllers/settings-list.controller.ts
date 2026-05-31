import type { IncomingMessage, ServerResponse } from "node:http";
import { ErrorCode } from "@lexos/shared/api";
import { sendJsonSuccess } from "../lib/http.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { SystemSettingsListService } from "../services/system-settings-list.service.js";

/** `GET /api/admin/settings` Controller。 */
export class SettingsListController {
  constructor(
    private readonly systemSettingsListService: SystemSettingsListService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(_req: IncomingMessage, res: ServerResponse): Promise<void> {
    const ctx = requireRequestContext();
    if (!ctx.accessToken) {
      throw new AppHttpError(ErrorCode.AUTH_UNAUTHORIZED, "Authentication required");
    }

    const result = await this.systemSettingsListService.list(ctx.accessToken);
    sendJsonSuccess(res, 200, result, this.requestIdHeader);
  }
}
