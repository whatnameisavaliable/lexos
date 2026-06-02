import { ErrorCode } from "@lexos/shared/api";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { SystemSettingReadService } from "./system-setting-read.service.js";

/**
 * 断言 Deep Research 功能已启用（`system_settings.sop.deep_research_enabled`）。
 */
export class SopDeepResearchGuardService {
  constructor(private readonly systemSettingReadService: SystemSettingReadService) {}

  async assertDeepResearchEnabled(): Promise<void> {
    const enabled = await this.systemSettingReadService.isDeepResearchEnabled();
    if (!enabled) {
      throw new AppHttpError(
        ErrorCode.OPERATION_NOT_ALLOWED,
        "Deep research is disabled by administrator",
      );
    }
  }
}
