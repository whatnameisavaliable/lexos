import type { SystemSettingUpsert } from "@lexos/shared";
import { ErrorCode } from "@lexos/shared/api";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { assertSystemSettingKeyAllowed } from "../lib/system-setting-key-guard.js";
import type { SystemSettingsRepository } from "../repositories/system-settings.repository.js";
import type { SystemSettingItem } from "../repositories/system-settings.types.js";
import type {
  AuditRequestMeta,
  AuditWriterService,
} from "./audit-writer.service.js";

/**
 * `PUT /api/admin/settings/:key` �?创建或更新系统配置�?
 */
export class SystemSettingsUpsertService {
  constructor(
    private readonly systemSettingsRepository: SystemSettingsRepository,
    private readonly auditWriterService: AuditWriterService,
  ) {}

  async upsert(
    accessToken: string,
    actorId: string,
    key: string,
    body: SystemSettingUpsert,
    meta: AuditRequestMeta = {},
  ): Promise<SystemSettingItem> {
    try {
      assertSystemSettingKeyAllowed(key);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message === "SYSTEM_SETTING_KEY_FORBIDDEN") {
        throw new AppHttpError(
          ErrorCode.VALIDATION_FAILED,
          "Setting key is not allowed",
        );
      }
      throw new AppHttpError(ErrorCode.VALIDATION_FAILED, "Invalid setting key");
    }

    const item = await this.systemSettingsRepository.upsert(
      accessToken,
      key.trim(),
      body.value,
      actorId,
    );

    await this.auditWriterService.write(
      {
        actorId,
        action: "user.update",
        targetType: "system_setting",
        targetId: null,
        metadata: { setting_key: item.key },
      },
      { ip: meta.ip, userAgent: meta.userAgent, client: meta.client },
    );

    return item;
  }
}
