import type { SystemSettingUpsert } from "@lexos/shared";
import { apiFetch } from "./api-client";

/** 系统配置项（API 响应）。 */
export interface SystemSettingData {
  readonly key: string;
  readonly value: Readonly<Record<string, unknown>>;
  readonly updatedBy: string | null;
  readonly updatedAt: string;
}

export interface SystemSettingListData {
  readonly items: readonly SystemSettingData[];
}

/** `GET /api/admin/settings` */
export async function listSettings(): Promise<SystemSettingListData> {
  const res = await apiFetch<SystemSettingListData>("/admin/settings", {
    method: "GET",
  });
  return res.data;
}

/** `GET /api/admin/settings/:key` */
export async function getSetting(key: string): Promise<SystemSettingData> {
  const encoded = encodeURIComponent(key);
  const res = await apiFetch<SystemSettingData>(`/admin/settings/${encoded}`, {
    method: "GET",
  });
  return res.data;
}

/** `PUT /api/admin/settings/:key` */
export async function upsertSetting(
  key: string,
  body: SystemSettingUpsert,
): Promise<SystemSettingData> {
  const encoded = encodeURIComponent(key);
  const res = await apiFetch<SystemSettingData>(`/admin/settings/${encoded}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return res.data;
}
