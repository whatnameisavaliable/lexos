import { describe, expect, it, vi } from "vitest";
import { AuthErrorCode } from "@lexos/shared";
import { AuthLoginService } from "./auth-login.service.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";

describe("AuthLoginService", () => {
  const authAdapter = {
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    resolveVirtualEmail: vi.fn(),
  };
  const profileRepository = { findById: vi.fn() };
  const auditLogRepository = { append: vi.fn() };

  const service = new AuthLoginService(
    authAdapter as never,
    profileRepository as never,
    auditLogRepository as never,
  );

  it("returns tokens on successful login", async () => {
    authAdapter.signInWithPassword.mockResolvedValue({
      accessToken: "at",
      refreshToken: "rt",
      userId: "u1",
      expiresAt: 1,
    });
    profileRepository.findById.mockResolvedValue({
      id: "u1",
      username: "lawyer",
      displayName: "L",
      role: "lawyer",
      contact: null,
      status: "enabled",
      requiresPasswordChange: false,
      mfaEnabled: false,
    });
    auditLogRepository.append.mockResolvedValue("audit-1");

    const result = await service.login({
      username: "lawyer",
      password: "secret",
    });

    expect(result.accessToken).toBe("at");
    expect(auditLogRepository.append).toHaveBeenCalledWith(
      expect.objectContaining({ action: "auth.login_success", actorId: "u1" }),
    );
  });

  it("maps invalid credentials to AUTH_INVALID_CREDENTIALS", async () => {
    const { AuthAdapterError } = await import(
      "../adapters/auth/supabase-auth.adapter.js"
    );
    authAdapter.signInWithPassword.mockRejectedValue(
      new AuthAdapterError("AUTH_INVALID_CREDENTIALS", "bad"),
    );
    auditLogRepository.append.mockResolvedValue("a");

    await expect(
      service.login({ username: "x", password: "y" }),
    ).rejects.toMatchObject({
      code: AuthErrorCode.AUTH_INVALID_CREDENTIALS,
    } satisfies Partial<AppHttpError>);
  });

  it("rejects disabled account with AUTH_ACCOUNT_DISABLED", async () => {
    authAdapter.signOut.mockResolvedValue(undefined);
    authAdapter.signInWithPassword.mockResolvedValue({
      accessToken: "at",
      refreshToken: "rt",
      userId: "u1",
    });
    profileRepository.findById.mockResolvedValue({
      id: "u1",
      username: "lawyer",
      displayName: "L",
      role: "lawyer",
      contact: null,
      status: "disabled",
      requiresPasswordChange: false,
      mfaEnabled: false,
    });
    auditLogRepository.append.mockResolvedValue("a");

    await expect(
      service.login({ username: "lawyer", password: "x" }),
    ).rejects.toMatchObject({
      code: AuthErrorCode.AUTH_ACCOUNT_DISABLED,
    });
  });
});
