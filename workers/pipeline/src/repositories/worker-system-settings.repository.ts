import type { PoolClient } from "pg";
import { SOP_DEEP_RESEARCH_ENABLED_KEY } from "@lexos/shared";

/**
 * Worker 侧系统配置读取（`service_role` 连接上下文）。
 */
export class WorkerSystemSettingsRepository {
  /**
   * Deep Research 是否启用（缺省 `true`；`prd.md` §4.2.4 SOP L4）。
   */
  async isDeepResearchEnabled(client: PoolClient): Promise<boolean> {
    const result = await client.query<{ value: unknown }>(
      `SELECT value
       FROM public.system_settings
       WHERE key = $1`,
      [SOP_DEEP_RESEARCH_ENABLED_KEY],
    );
    const value = result.rows[0]?.value;
    return parseDeepResearchEnabledValue(value);
  }
}

function parseDeepResearchEnabledValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    if (typeof record.enabled === "boolean") {
      return record.enabled;
    }
  }
  return Boolean(value);
}
