import type { SystemSettingsRepository } from "../repositories/system-settings.repository.js";
import type { SystemSettingItem } from "../repositories/system-settings.types.js";

/**
 * `GET /api/admin/settings` — 系统配置列表。
 */
export class SystemSettingsListService {
  constructor(
    private readonly systemSettingsRepository: SystemSettingsRepository,
  ) {}

  async list(accessToken: string): Promise<{ readonly items: readonly SystemSettingItem[] }> {
    const items = await this.systemSettingsRepository.list(accessToken);
    return { items };
  }
}
