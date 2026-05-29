/**
 * 认证路由注册表（实际挂载见 `app.ts`）。
 * 公开：`POST /api/auth/login`
 * 受保护：`logout`、`session`、`change-password`、`profile`（经 auth + password-change-gate）。
 */
export const AUTH_ROUTE_PATHS = {
  login: "/api/auth/login",
  logout: "/api/auth/logout",
  session: "/api/auth/session",
  changePassword: "/api/auth/change-password",
} as const;
