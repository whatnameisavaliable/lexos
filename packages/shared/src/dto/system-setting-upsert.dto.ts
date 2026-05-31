import { z } from "zod";

/**
 * `PUT /api/admin/settings/:key` 请求体。
 * `value` 为律所级 JSON 配置对象（`database.md` §3.12）。
 */
export const systemSettingUpsertSchema = z.object({
  value: z.record(z.string(), z.unknown()),
});

/** 原始请求体。 */
export type SystemSettingUpsertRaw = z.infer<typeof systemSettingUpsertSchema>;

/** 系统配置更新 DTO。 */
export interface SystemSettingUpsert {
  readonly value: Readonly<Record<string, unknown>>;
}

/**
 * 解析并校验系统配置更新请求体；失败抛出 `ZodError`。
 */
export function parseSystemSettingUpsert(input: unknown): SystemSettingUpsert {
  const raw = systemSettingUpsertSchema.parse(input);
  return { value: raw.value };
}
