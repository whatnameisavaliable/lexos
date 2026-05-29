import type { AuthLoginBody, AuthChangePasswordBody } from "@lexos/shared";
import { apiFetch } from "./api-client";
import { setAccessToken, clearAccessToken } from "./session";

/** 登录成功响应（U2 `AuthLoginService`）。 */
export interface LoginResponseData {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly userId: string;
  readonly expiresAt?: number;
}

/** 会话摘要（`GET /api/auth/session`）。 */
export interface SessionResponseData {
  readonly userId: string;
  readonly username: string;
  readonly displayName: string;
  readonly role: string;
  readonly contact: string | null;
  readonly requiresPasswordChange: boolean;
  readonly mfaEnabled: boolean;
  readonly status: string;
}

/** `POST /api/auth/login` */
export async function login(body: AuthLoginBody): Promise<LoginResponseData> {
  const res = await apiFetch<LoginResponseData>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
  setAccessToken(res.data.accessToken);
  return res.data;
}

/** `POST /api/auth/logout` */
export async function logout(): Promise<void> {
  try {
    await apiFetch<{ ok: boolean }>("/auth/logout", { method: "POST" });
  } finally {
    clearAccessToken();
  }
}

/** `GET /api/auth/session` */
export async function getSession(): Promise<SessionResponseData> {
  const res = await apiFetch<SessionResponseData>("/auth/session", {
    method: "GET",
  });
  return res.data;
}

/** `POST /api/auth/change-password` */
export async function changePassword(
  body: AuthChangePasswordBody,
): Promise<void> {
  await apiFetch<{ ok: boolean }>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
