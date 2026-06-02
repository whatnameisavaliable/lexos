import { ErrorCode } from "@lexos/shared/api";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import type { SystemSettingsRepository } from "../repositories/system-settings.repository.js";
import type { SystemSettingItem } from "../repositories/system-settings.types.js";

/**
 * `GET /api/admin/settings/:key` �?单条系统配置�?
 */
export class SystemSettingsGetService {
  constructor(
    private readonly systemSettingsRepository: SystemSettingsRepository,
  ) {}

  async get(accessToken: string, key: string): Promise<SystemSettingItem> {
    const item = await this.systemSettingsRepository.get(accessToken, key);
    if (!item) {
      throw new AppHttpError(
        ErrorCode.RESOURCE_NOT_FOUND,
        "System setting not found",
      );
    }
    return item;
  }
}
