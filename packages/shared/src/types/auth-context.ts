import type { UserRole } from "./user-role.js";

/**
 * 经认证中间件注入的请求上下文（`architecture.md` §2.3.1）。
 * 角色以 `profiles.role` 为准，禁止信任 JWT 自定义 claim。
 */
export interface AuthContext {
  /** Supabase `auth.users.id`，与 `profiles.id` 一致。 */
  readonly userId: string;
  /** 业务角色（`profiles.role`）。 */
  readonly role: UserRole;
  /** 登录用户名（`profiles.username`）。 */
  readonly username: string;
  /** 是否须先完成改密（`profiles.requires_password_change`）。 */
  readonly requiresPasswordChange: boolean;
  /**
   * Supabase 会话标识（`session_id`），可选。
   * 审计或登出单会话时使用。
   */
  readonly sessionId?: string;
}

/**
 * 从 JWT + profiles 行组装 {@link AuthContext}。
 */
export function createAuthContext(params: {
  readonly userId: string;
  readonly role: UserRole;
  readonly username: string;
  readonly requiresPasswordChange: boolean;
  readonly sessionId?: string;
}): AuthContext {
  return {
    userId: params.userId,
    role: params.role,
    username: params.username,
    requiresPasswordChange: params.requiresPasswordChange,
    ...(params.sessionId !== undefined ? { sessionId: params.sessionId } : {}),
  };
}
