/** SOP 相关 `system_settings.key`（`database.md` §3.12 · PRD-SOP-41）。 */
export const SOP_DEEP_RESEARCH_ENABLED_KEY =
  "sop.deep_research_enabled" as const;

/** 全部 SOP 系统设置键。 */
export const SOP_SYSTEM_SETTINGS_KEYS = [
  SOP_DEEP_RESEARCH_ENABLED_KEY,
] as const;

/** SOP 系统设置键联合类型。 */
export type SopSystemSettingsKey = (typeof SOP_SYSTEM_SETTINGS_KEYS)[number];
