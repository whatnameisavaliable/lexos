import {
  createClient,
  type AuthMFAEnrollResponse,
  type AuthMFAVerifyResponse,
  type Session,
  type SupabaseClient,
} from "@supabase/supabase-js";
import {
  resolveVirtualEmail,
  type AuthRuntimeEnvConfig,
  type SupabaseEnvConfig,
} from "@lexos/shared/config";

/** 登录成功返回的会话摘要（不含 refresh token 日志输出）。 */
export interface AuthSignInResult {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly userId: string;
  readonly sessionId: string | undefined;
  readonly expiresAt: number | undefined;
}

/** MFA 注册（enroll）结果。 */
export interface AuthMfaEnrollResult {
  readonly factorId: string;
  readonly qrCode: string;
  readonly secret: string;
  readonly uri: string;
}

/** MFA  assurance 级别（Supabase AAL）。 */
export interface AuthMfaAssuranceResult {
  readonly currentLevel: "aal1" | "aal2" | null;
  readonly nextLevel: "aal1" | "aal2" | null;
}

/**
 * Supabase Auth 封装（`architecture.md` §4.4；仅经 Adapter 访问 Auth）。
 */
export class SupabaseAuthAdapter {
  private readonly anonClient: SupabaseClient;
  private readonly adminClient: SupabaseClient;
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;

  /**
   * @param supabaseEnv - `SUPABASE_URL`、anon/service_role 密钥
   * @param authEnv - `AUTH_VIRTUAL_EMAIL_DOMAIN` 等
   */
  constructor(
    supabaseEnv: SupabaseEnvConfig,
    private readonly authEnv: Pick<AuthRuntimeEnvConfig, "authVirtualEmailDomain">,
  ) {
    this.supabaseUrl = supabaseEnv.supabaseUrl;
    this.supabaseAnonKey = supabaseEnv.supabaseAnonKey;
    this.anonClient = createClient(this.supabaseUrl, this.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    this.adminClient = createClient(
      supabaseEnv.supabaseUrl,
      supabaseEnv.supabaseServiceRoleKey,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }

  /**
   * 将登录用户名解析为 Supabase Auth 虚拟邮箱（PRD §2.5.1）。
   */
  resolveVirtualEmail(username: string): string {
    return resolveVirtualEmail(username, this.authEnv.authVirtualEmailDomain);
  }

  /**
   * 用户名 + 密码登录（内部转换为虚拟邮箱）。
   */
  async signInWithPassword(
    username: string,
    password: string,
  ): Promise<AuthSignInResult> {
    const email = this.resolveVirtualEmail(username);
    const { data, error } = await this.anonClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user) {
      throw new AuthAdapterError(
        "AUTH_INVALID_CREDENTIALS",
        error?.message ?? "sign in failed",
      );
    }

    return this.mapSession(data.session, data.user.id);
  }

  /**
   * 注销当前 access token 对应会话。
   */
  async signOut(accessToken: string): Promise<void> {
    const client = this.clientWithAccessToken(accessToken);
    const { error } = await client.auth.signOut();
    if (error) {
      throw new AuthAdapterError("INTERNAL_ERROR", error.message);
    }
  }

  /**
   * 管理员创建 Auth 用户（虚拟邮箱 + 初始密码，PRD §2.5.1）。
   */
  async adminCreateUser(
    virtualEmail: string,
    initialPassword: string,
  ): Promise<{ readonly userId: string }> {
    const { data, error } = await this.adminClient.auth.admin.createUser({
      email: virtualEmail,
      password: initialPassword,
      email_confirm: true,
    });

    if (error || !data.user) {
      throw new AuthAdapterError(
        "INTERNAL_ERROR",
        error?.message ?? "admin createUser failed",
      );
    }

    return { userId: data.user.id };
  }

  /**
   * 删除 Auth 用户（创建失败回滚；须先删除 `profiles` 行）。
   */
  async adminDeleteUser(userId: string): Promise<void> {
    const { error } = await this.adminClient.auth.admin.deleteUser(userId);
    if (error) {
      throw new AuthAdapterError("INTERNAL_ERROR", error.message);
    }
  }

  /**
   * 管理员更新用户密码（`AUTH_INITIAL_PASSWORD` 等，M2 重置密码）。
   */
  async adminUpdateUserPassword(
    userId: string,
    password: string,
  ): Promise<void> {
    await this.updateUserPasswordAsAdmin(userId, password);
  }

  /**
   * 吊销指定用户全部会话（管理员禁用/重置密码）。
   */
  async adminSignOutGlobal(userId: string): Promise<void> {
    await this.signOutGlobal(userId);
  }

  /**
   * 吊销指定用户全部会话（管理员重置密码等场景，M2 复用）。
   */
  async signOutGlobal(userId: string): Promise<void> {
    const { error } = await this.adminClient.auth.admin.signOut(userId, "global");
    if (error) {
      throw new AuthAdapterError("INTERNAL_ERROR", error.message);
    }
  }

  /**
   * 以用户 access token 更新本人密码。
   *
   * @remarks 仅设置 `Authorization` 头不足以满足 `auth.updateUser`（会报 Auth session missing）；
   * BFF 改密请用 {@link updateUserPasswordAsAdmin}（请求经 JWT 鉴权后）。
   */
  async updateUserPasswordWithSession(
    accessToken: string,
    newPassword: string,
  ): Promise<void> {
    const client = this.clientWithAccessToken(accessToken);
    const { error } = await client.auth.updateUser({ password: newPassword });
    if (error) {
      throw new AuthAdapterError("INTERNAL_ERROR", error.message);
    }
  }

  /**
   * 以 Admin API 更新指定用户密码（Service 层在已知 userId 时使用）。
   */
  async updateUserPasswordAsAdmin(
    userId: string,
    newPassword: string,
  ): Promise<void> {
    const { error } = await this.adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (error) {
      throw new AuthAdapterError("INTERNAL_ERROR", error.message);
    }
  }

  /**
   * 发起 TOTP MFA 注册，返回 QR 与 factorId（PRD §2.5.2）。
   */
  async enrollMfa(accessToken: string): Promise<AuthMfaEnrollResult> {
    const client = this.clientWithAccessToken(accessToken);
    const { data, error } = await client.auth.mfa.enroll({
      factorType: "totp",
    });

    if (error || !data) {
      throw new AuthAdapterError(
        "INTERNAL_ERROR",
        error?.message ?? "MFA enroll failed",
      );
    }

    return this.mapEnrollResponse(data);
  }

  /**
   * 校验 TOTP 并提升 assurance level。
   */
  async verifyMfa(
    accessToken: string,
    factorId: string,
    code: string,
  ): Promise<AuthMFAVerifyResponse> {
    const client = this.clientWithAccessToken(accessToken);
    const challenge = await client.auth.mfa.challenge({ factorId });
    if (challenge.error || !challenge.data) {
      throw new AuthAdapterError(
        "INTERNAL_ERROR",
        challenge.error?.message ?? "MFA challenge failed",
      );
    }

    const { data, error } = await client.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code,
    });

    if (error) {
      throw new AuthAdapterError(
        "AUTH_MFA_REQUIRED",
        error.message,
      );
    }

    return data;
  }

  /**
   * 查询当前会话 MFA assurance level。
   */
  async getMfaAuthenticatorAssuranceLevel(
    accessToken: string,
  ): Promise<AuthMfaAssuranceResult> {
    const client = this.clientWithAccessToken(accessToken);
    const { data, error } =
      await client.auth.mfa.getAuthenticatorAssuranceLevel();

    if (error) {
      throw new AuthAdapterError("INTERNAL_ERROR", error.message);
    }

    return {
      currentLevel: data.currentLevel,
      nextLevel: data.nextLevel,
    };
  }

  private clientWithAccessToken(accessToken: string): SupabaseClient {
    return createClient(this.supabaseUrl, this.supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      },
    );
  }

  private mapSession(session: Session, userId: string): AuthSignInResult {
    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      userId,
      sessionId: undefined,
      expiresAt: session.expires_at ?? undefined,
    };
  }

  private mapEnrollResponse(data: AuthMFAEnrollResponse): AuthMfaEnrollResult {
    const totp = data.totp;
    if (!totp) {
      throw new AuthAdapterError("INTERNAL_ERROR", "MFA enroll missing TOTP");
    }
    return {
      factorId: data.id,
      qrCode: totp.qr_code,
      secret: totp.secret,
      uri: totp.uri,
    };
  }
}

/** Auth Adapter 可预期失败（映射为 API 错误码）。 */
export class AuthAdapterError extends Error {
  /**
   * @param code - 业务错误码字符串（与 `ErrorCode` 对齐）
   * @param message - 不含密钥的人类可读信息
   */
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AuthAdapterError";
  }
}
