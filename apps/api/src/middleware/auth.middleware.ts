import { createClient } from "@supabase/supabase-js";
import type { IncomingMessage, ServerResponse } from "node:http";
import { AuthErrorCode, createAuthContext } from "@lexos/shared";
import type { SupabaseEnvConfig } from "@lexos/shared/config";
import type { ProfileRepository } from "../repositories/profile.repository.js";
import { AppHttpError, sendApiError } from "./error-handler.middleware.js";
import { getRequestContext, runWithRequestContext } from "./request-context.js";

/** 进程内 `profiles.status` 缓存 TTL（`architecture.md` §5.1.3）。 */
export const PROFILE_STATUS_CACHE_TTL_MS = 30_000;

interface CachedProfile {
  readonly profile: Awaited<ReturnType<ProfileRepository["findById"]>>;
  readonly expiresAt: number;
}

const profileCache = new Map<string, CachedProfile>();

/**
 * 从 `Authorization: Bearer` 解析 access token。
 */
export function parseBearerToken(req: IncomingMessage): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

/**
 * 认证中间件：校验 JWT、加载 `profiles`、注入 {@link AuthContext}。
 */
export class AuthMiddleware {
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;

  constructor(
    supabaseEnv: SupabaseEnvConfig,
    private readonly profileRepository: ProfileRepository,
  ) {
    this.supabaseUrl = supabaseEnv.supabaseUrl;
    this.supabaseAnonKey = supabaseEnv.supabaseAnonKey;
  }

  /**
   * 要求已登录；失败时写入错误响应并返回 `false`。
   */
  async requireAuth(
    req: IncomingMessage,
    res: ServerResponse,
    handler: () => void | Promise<void>,
  ): Promise<boolean> {
    const accessToken = parseBearerToken(req);
    if (!accessToken) {
      sendApiError(
        res,
        AuthErrorCode.AUTH_UNAUTHORIZED,
        "Authentication required",
        getRequestContext()?.requestId,
      );
      return false;
    }

    const userId = await this.resolveUserId(accessToken);
    if (!userId) {
      sendApiError(
        res,
        AuthErrorCode.AUTH_UNAUTHORIZED,
        "Invalid or expired token",
        getRequestContext()?.requestId,
      );
      return false;
    }

    const profile = await this.loadProfile(accessToken, userId);
    if (!profile) {
      sendApiError(
        res,
        AuthErrorCode.AUTH_UNAUTHORIZED,
        "Profile not found",
        getRequestContext()?.requestId,
      );
      return false;
    }

    if (profile.status === "disabled") {
      sendApiError(
        res,
        AuthErrorCode.AUTH_ACCOUNT_DISABLED,
        "Account is disabled",
        getRequestContext()?.requestId,
      );
      return false;
    }

    const auth = createAuthContext({
      userId: profile.id,
      role: profile.role,
      username: profile.username,
      requiresPasswordChange: profile.requiresPasswordChange,
    });

    const parent = getRequestContext();
    if (!parent) {
      throw new Error("AuthMiddleware requires withRequestId wrapper");
    }

    const nextContext = {
      ...parent,
      accessToken,
      auth,
      profile,
    };

    try {
      await runWithRequestContext(nextContext, async () => {
        await handler();
      });
      return true;
    } catch (err) {
      if (err instanceof AppHttpError) {
        sendApiError(
          res,
          err.code,
          err.message,
          parent.requestId,
          err.details,
        );
        return false;
      }
      throw err;
    }
  }

  private async resolveUserId(accessToken: string): Promise<string | null> {
    const client = createClient(this.supabaseUrl, this.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data, error } = await client.auth.getUser(accessToken);
    if (error || !data.user) {
      return null;
    }
    return data.user.id;
  }

  private async loadProfile(
    accessToken: string,
    userId: string,
  ): Promise<CachedProfile["profile"]> {
    const now = Date.now();
    const cached = profileCache.get(userId);
    if (cached && cached.expiresAt > now) {
      return cached.profile;
    }

    const profile = await this.profileRepository.findById(
      accessToken,
      userId,
    );
    profileCache.set(userId, {
      profile,
      expiresAt: now + PROFILE_STATUS_CACHE_TTL_MS,
    });
    return profile;
  }
}

/** 供测试或禁用用户后立即使缓存失效。 */
export function clearProfileStatusCache(userId?: string): void {
  if (userId) {
    profileCache.delete(userId);
    return;
  }
  profileCache.clear();
}
