/** `system_settings` 数据库行。 */
export interface SystemSettingRowDb {
  readonly key: string;
  readonly value: Record<string, unknown>;
  readonly updated_by: string | null;
  readonly updated_at: string;
}

/** API 系统配置项（camelCase）。 */
export interface SystemSettingItem {
  readonly key: string;
  readonly value: Readonly<Record<string, unknown>>;
  readonly updatedBy: string | null;
  readonly updatedAt: string;
}

/** 映射数据库行 → API 项。 */
export function mapSystemSettingRow(row: SystemSettingRowDb): SystemSettingItem {
  return {
    key: row.key,
    value: row.value ?? {},
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}
