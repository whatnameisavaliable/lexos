import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AuthAdapterError,
  SupabaseAuthAdapter,
} from "./supabase-auth.adapter.js";
import { NoneCaptchaAdapter } from "./none-captcha.adapter.js";
import { createCaptchaAdapter } from "./create-captcha-adapter.js";
import { TurnstileCaptchaAdapterStub } from "./turnstile-captcha.adapter.js";

const supabaseEnv = {
  supabaseUrl: "https://example.supabase.co",
  supabaseAnonKey: "anon-key",
  supabaseServiceRoleKey: "service-key",
  supabaseJwtSecret: "jwt-secret",
  supabaseDbUrl: "postgresql://localhost/postgres",
};

const authEnv = { authVirtualEmailDomain: "llexos.internal" };

vi.mock("@supabase/supabase-js", () => {
  const signInWithPassword = vi.fn();
  const signOut = vi.fn();
  const adminSignOut = vi.fn();
  const updateUserById = vi.fn();
  const enroll = vi.fn();
  const challenge = vi.fn();
  const verify = vi.fn();
  const getAuthenticatorAssuranceLevel = vi.fn();

  const auth = {
    signInWithPassword,
    signOut,
    updateUser: vi.fn(),
    mfa: { enroll, challenge, verify, getAuthenticatorAssuranceLevel },
    admin: { signOut: adminSignOut, updateUserById },
  };

  return {
    createClient: vi.fn(() => ({ auth })),
    __mocks: {
      signInWithPassword,
      signOut,
      adminSignOut,
      updateUserById,
      enroll,
      challenge,
      verify,
      getAuthenticatorAssuranceLevel,
    },
  };
});

describe("SupabaseAuthAdapter", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("resolveVirtualEmail uses AUTH_VIRTUAL_EMAIL_DOMAIN", () => {
    const adapter = new SupabaseAuthAdapter(supabaseEnv, authEnv);
    expect(adapter.resolveVirtualEmail("Admin")).toBe("admin@llexos.internal");
  });

  it("signInWithPassword returns session on success", async () => {
    const { createClient, __mocks } = await import("@supabase/supabase-js");
    const mocks = __mocks as {
      signInWithPassword: ReturnType<typeof vi.fn>;
    };
    mocks.signInWithPassword.mockResolvedValue({
      data: {
        session: {
          access_token: "at",
          refresh_token: "rt",
          expires_at: 999,
        },
        user: { id: "user-1" },
      },
      error: null,
    });

    const adapter = new SupabaseAuthAdapter(supabaseEnv, authEnv);
    const result = await adapter.signInWithPassword("admin", "secret");

    expect(createClient).toHaveBeenCalled();
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: "admin@llexos.internal",
      password: "secret",
    });
    expect(result.accessToken).toBe("at");
    expect(result.userId).toBe("user-1");
  });

  it("signInWithPassword throws AUTH_INVALID_CREDENTIALS on failure", async () => {
    const { __mocks } = await import("@supabase/supabase-js");
    const mocks = __mocks as {
      signInWithPassword: ReturnType<typeof vi.fn>;
    };
    mocks.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: "Invalid login credentials" },
    });

    const adapter = new SupabaseAuthAdapter(supabaseEnv, authEnv);
    await expect(adapter.signInWithPassword("x", "y")).rejects.toMatchObject({
      code: "AUTH_INVALID_CREDENTIALS",
    } satisfies Partial<AuthAdapterError>);
  });

  it("signOutGlobal calls admin signOut", async () => {
    const { __mocks } = await import("@supabase/supabase-js");
    const mocks = __mocks as { adminSignOut: ReturnType<typeof vi.fn> };
    mocks.adminSignOut.mockResolvedValue({ error: null });

    const adapter = new SupabaseAuthAdapter(supabaseEnv, authEnv);
    await adapter.signOutGlobal("user-1");

    expect(mocks.adminSignOut).toHaveBeenCalledWith("user-1", "global");
  });
});

describe("Captcha adapters", () => {
  it("NoneCaptchaAdapter always succeeds", async () => {
    const adapter = new NoneCaptchaAdapter();
    await expect(adapter.verify("any")).resolves.toEqual({ success: true });
  });

  it("createCaptchaAdapter returns none implementation", () => {
    expect(createCaptchaAdapter({ captchaProvider: "none" })).toBeInstanceOf(
      NoneCaptchaAdapter,
    );
  });

  it("Turnstile stub throws until implemented", async () => {
    const adapter = new TurnstileCaptchaAdapterStub();
    await expect(adapter.verify("token")).rejects.toThrow(/not implemented/);
  });
});
