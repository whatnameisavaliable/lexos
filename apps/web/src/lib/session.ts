/** 浏览器会话 access token Cookie 名（非 HttpOnly，供 Next middleware 与 BFF 请求共用）。 */
export const ACCESS_TOKEN_COOKIE = "lexos_access_token";

/** localStorage 键（JWT 较长时比 Cookie 解析更稳）。 */
const ACCESS_TOKEN_STORAGE_KEY = "lexos_access_token";

/**
 * 写入 access token（登录成功后调用）。
 */
export function setAccessToken(token: string): void {
  if (typeof document === "undefined") {
    return;
  }
  try {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  } catch {
    /* private mode / quota */
  }
  const encoded = encodeURIComponent(token);
  document.cookie = `${ACCESS_TOKEN_COOKIE}=${encoded}; path=/; SameSite=Lax`;
}

/** 读取 access token；无则 `null`。 */
export function getAccessToken(): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  try {
    const stored = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    if (stored) {
      return stored;
    }
  } catch {
    /* ignore */
  }
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${ACCESS_TOKEN_COOKIE}=`));
  if (!match) {
    return null;
  }
  return decodeURIComponent(match.split("=").slice(1).join("="));
}

/** 清除会话 token。 */
export function clearAccessToken(): void {
  if (typeof document === "undefined") {
    return;
  }
  try {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=/; Max-Age=0; SameSite=Lax`;
}
