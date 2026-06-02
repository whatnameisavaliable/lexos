import { SOP_DEEP_RESEARCH_ENABLED_KEY } from "@lexos/shared";
import type { SystemSettingReadRepository } from "../repositories/system-setting-read.repository.js";

/**
 * 读取律所级系统开关（`system_settings`）。
 */
export class SystemSettingReadService {
  constructor(private readonly repository: SystemSettingReadRepository) {}

  /**
   * Deep Research 是否启用（缺省 `true`，`prd.md` §4.2.4 SOP L4）。
   */
  async isDeepResearchEnabled(): Promise<boolean> {
    const value = await this.repository.getValue(SOP_DEEP_RESEARCH_ENABLED_KEY);
    if (value === null || value === undefined) {
      return true;
    }
    if (typeof value === "boolean") {
      return value;
    }
    if (
      typeof value === "object" &&
      value !== null &&
      "enabled" in value &&
      typeof (value as { enabled: unknown }).enabled === "boolean"
    ) {
      return (value as { enabled: boolean }).enabled;
    }
    return Boolean(value);
  }
}
