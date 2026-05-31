/** 浏览器会话 access token Cookie 名（非 HttpOnly，供 Next middleware 与 BFF 请求共用）。 */
export const ACCESS_TOKEN_COOKIE = "lexos_access_token";

/** localStorage 键（JWT 较长时比 Cookie 解析更稳）。 */
const ACCESS_TOKEN_STORAGE_KEY = "lexos_access_token";

/** refresh token 仅存 localStorage（体积大，且仅 BFF 刷新使用）。 */
const REFRESH_TOKEN_STORAGE_KEY = "lexos_refresh_token";

function isJwtShape(token: string): boolean {
  const parts = token.split(".");
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

function readCookieAccessToken(): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${ACCESS_TOKEN_COOKIE}=`));
  if (!match) {
    return null;
  }
  const raw = match.split("=").slice(1).join("=");
  try {
    const decoded = decodeURIComponent(raw);
    return isJwtShape(decoded) ? decoded : null;
  } catch {
    return isJwtShape(raw) ? raw : null;
  }
}

/**
 * 写入 access / refresh token（登录或刷新成功后调用）。
 */
export function setSessionTokens(
  accessToken: string,
  refreshToken?: string | null,
): void {
  setAccessToken(accessToken);
  if (typeof document === "undefined" || !refreshToken) {
    return;
  }
  try {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  } catch {
    /* private mode / quota */
  }
}

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

/** 读取 refresh token；无则 `null`。 */
export function getRefreshToken(): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  try {
    return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** 读取 access token；无则 `null`。 */
export function getAccessToken(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  let fromStorage: string | null = null;
  try {
    const stored = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    if (stored && isJwtShape(stored)) {
      fromStorage = stored;
    }
  } catch {
    /* ignore */
  }

  const fromCookie = readCookieAccessToken();

  if (fromStorage && fromCookie && fromStorage !== fromCookie) {
    setAccessToken(fromCookie);
    return fromCookie;
  }

  return fromStorage ?? fromCookie;
}

/** 清除会话 token。 */
export function clearAccessToken(): void {
  if (typeof document === "undefined") {
    return;
  }
  try {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=/; Max-Age=0; SameSite=Lax`;
}
