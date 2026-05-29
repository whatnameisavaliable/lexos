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

/** 改密成功响应（含刷新后的 access token）。 */
export interface ChangePasswordResponseData {
  readonly ok: boolean;
  readonly accessToken: string;
  readonly expiresAt?: number;
}

/** `POST /api/auth/change-password` */
export async function changePassword(
  body: AuthChangePasswordBody,
): Promise<void> {
  const res = await apiFetch<ChangePasswordResponseData>(
    "/auth/change-password",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
  if (res.data.accessToken) {
    setAccessToken(res.data.accessToken);
  }
}

/** MFA 注册响应（目标态；首期 API 未挂载）。 */
export interface MfaEnrollResponseData {
  readonly factorId: string;
  readonly qrCode: string;
}

/**
 * `POST /api/auth/mfa/enroll`（首期未启用时占位，避免构建失败）。
 */
export async function mfaEnroll(): Promise<MfaEnrollResponseData> {
  const res = await apiFetch<MfaEnrollResponseData>("/auth/mfa/enroll", {
    method: "POST",
  });
  return res.data;
}

/**
 * `POST /api/auth/mfa/verify`（首期未启用时占位）。
 */
export async function mfaVerify(factorId: string, code: string): Promise<void> {
  await apiFetch<{ ok: boolean }>("/auth/mfa/verify", {
    method: "POST",
    body: JSON.stringify({ factorId, code }),
  });
}
