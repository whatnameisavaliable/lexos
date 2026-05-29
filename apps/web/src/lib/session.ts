/** 浏览器会话 access token Cookie 名（非 HttpOnly，供 Next middleware 与 BFF 请求共用）。 */
export const ACCESS_TOKEN_COOKIE = "lexos_access_token";

/**
 * 写入 access token（登录成功后调用）。
 */
export function setAccessToken(token: string): void {
  if (typeof document === "undefined") {
    return;
  }
  const encoded = encodeURIComponent(token);
  document.cookie = `${ACCESS_TOKEN_COOKIE}=${encoded}; path=/; SameSite=Lax`;
}

/** 读取 access token；无则 `null`。 */
export function getAccessToken(): string | null {
  if (typeof document === "undefined") {
    return null;
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
  document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=/; Max-Age=0; SameSite=Lax`;
}
