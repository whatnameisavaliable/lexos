import { getRefreshToken, setSessionTokens } from "./session";

interface RefreshSessionData {
  readonly accessToken: string;
  readonly refreshToken: string;
}

/**
 * 使用 refresh token 向 BFF 换取新 access token（避免经 api-client 造成 401 递归）。
 */
export async function refreshSession(): Promise<RefreshSessionData> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  const response = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    credentials: "include",
  });

  const payload = (await response.json()) as {
    success?: boolean;
    data?: RefreshSessionData;
    error?: { message?: string };
  };

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error?.message ?? "Refresh failed");
  }

  setSessionTokens(payload.data.accessToken, payload.data.refreshToken);
  return payload.data;
}
