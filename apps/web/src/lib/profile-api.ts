import type { ProfileUpdateBody } from "@lexos/shared";
import { apiFetch } from "./api-client";

/** 个人资料 DTO（`GET/PATCH /api/profile`）。 */
export interface ProfileResponseData {
  readonly userId: string;
  readonly username: string;
  readonly displayName: string;
  readonly role: string;
  readonly contact: string | null;
  readonly mfaEnabled: boolean;
  readonly status: string;
}

/** `GET /api/profile` */
export async function getProfile(): Promise<ProfileResponseData> {
  const res = await apiFetch<ProfileResponseData>("/profile", { method: "GET" });
  return res.data;
}

/** `PATCH /api/profile` */
export async function updateProfile(
  body: ProfileUpdateBody,
): Promise<ProfileResponseData> {
  const res = await apiFetch<ProfileResponseData>("/profile", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return res.data;
}
