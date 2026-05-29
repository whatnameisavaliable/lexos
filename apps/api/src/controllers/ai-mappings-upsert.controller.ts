import type { IncomingMessage, ServerResponse } from "node:http";
import { parseAiFeatureMappingUpsertBody } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { getClientIp, getUserAgent, readJsonBody, sendJsonSuccess } from "../lib/http.js";
import { requireRequestContext } from "../middleware/request-context.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { AiFeatureMappingUpsertService } from "../services/ai-feature-mapping-upsert.service.js";

/** `PUT /api/admin/ai/mappings/:featureKey` Controller。 */
export class AiMappingsUpsertController {
  constructor(
    private readonly service: AiFeatureMappingUpsertService,
    private readonly requestIdHeader: string,
  ) {}

  async handle(
    req: IncomingMessage,
    res: ServerResponse,
    params: { readonly featureKey: string },
  ): Promise<void> {
    const ctx = requireRequestContext();
    const raw = await readJsonBody<unknown>(req);
    let body;
    try {
      body = parseAiFeatureMappingUpsertBody(raw ?? {});
    } catch {
      throw new AppHttpError(
        ErrorCode.VALIDATION_FAILED,
        "Invalid mapping payload",
      );
    }

    const result = await this.service.upsert(
      ctx.auth,
      params.featureKey,
      body,
      { ip: getClientIp(req), userAgent: getUserAgent(req) },
    );
    sendJsonSuccess(res, 200, result, this.requestIdHeader);
  }
}
