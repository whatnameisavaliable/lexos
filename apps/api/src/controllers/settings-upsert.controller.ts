import type { IncomingMessage, ServerResponse } from "node:http";
import { parseSystemSettingUpsert } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { getClientIp, getUserAgent, readJsonBody, sendJsonSuccess } from "../lib/http.js";
import { parseAuditClientHeaders } from "../lib/audit-client-metadata.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { requireRequestContext } from "../middleware/request-context.js";
import type { SystemSettingsUpsertService } from "../services/system-settings-upsert.service.js";

/** `PUT /api/admin/settings/:key` Controller。 */
export class SettingsUpsertController {
  constructor(
    private readonly systemSettingsUpsertService: SystemSettingsUpsertService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(
    req: IncomingMessage,
    res: ServerResponse,
    params: { readonly key: string },
  ): Promise<void> {
    const ctx = requireRequestContext();
    if (!ctx.auth || !ctx.accessToken) {
      throw new AppHttpError(ErrorCode.AUTH_UNAUTHORIZED, "Authentication required");
    }

    const raw = await readJsonBody<unknown>(req);
    let body;
    try {
      body = parseSystemSettingUpsert(raw ?? {});
    } catch {
      throw new AppHttpError(
        ErrorCode.VALIDATION_FAILED,
        "Invalid system setting payload",
      );
    }

    const key = decodeURIComponent(params.key);
    const item = await this.systemSettingsUpsertService.upsert(
      ctx.accessToken,
      ctx.auth.userId,
      key,
      body,
      {
        ip: getClientIp(req),
        userAgent: getUserAgent(req),
        client: parseAuditClientHeaders(req.headers as Record<string, string | string[] | undefined>),
      },
    );
    sendJsonSuccess(res, 200, item, this.requestIdHeader);
  }
}
