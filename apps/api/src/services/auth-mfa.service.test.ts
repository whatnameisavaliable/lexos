import { describe, expect, it, vi } from "vitest";
import { AuthErrorCode, createAuthContext } from "@lexos/shared";
import { AuthMfaService } from "./auth-mfa.service.js";

describe("AuthMfaService", () => {
  const authAdapter = {
    enrollMfa: vi.fn(),
    verifyMfa: vi.fn(),
    getMfaAuthenticatorAssuranceLevel: vi.fn(),
  };
  const profileAdminRepository = { setMfaEnabled: vi.fn() };
  const authEnv = { mfaRequiredRoles: ["admin", "director"] as const };

  const service = new AuthMfaService(
    authAdapter as never,
    profileAdminRepository as never,
    authEnv,
  );

  const profile = {
    id: "u1",
    username: "admin",
    displayName: "A",
    role: "admin" as const,
    contact: null,
    status: "enabled" as const,
    requiresPasswordChange: false,
    mfaEnabled: false,
  };

  it("throws AUTH_MFA_REQUIRED when admin has not enrolled", async () => {
    authAdapter.getMfaAuthenticatorAssuranceLevel.mockResolvedValue({
      currentLevel: "aal1",
      nextLevel: "aal2",
    });

    await expect(
      service.getStatus(
        createAuthContext({
          userId: "u1",
          role: "admin",
          username: "admin",
          requiresPasswordChange: false,
        }),
        "at",
        profile,
      ),
    ).rejects.toMatchObject({ code: AuthErrorCode.AUTH_MFA_REQUIRED });
  });

  it("verify enables mfa on profile", async () => {
    authAdapter.verifyMfa.mockResolvedValue({});
    profileAdminRepository.setMfaEnabled.mockResolvedValue(undefined);

    await service.verify(
      createAuthContext({
        userId: "u1",
        role: "admin",
        username: "admin",
        requiresPasswordChange: false,
      }),
      "at",
      "factor-1",
      "123456",
    );

    expect(profileAdminRepository.setMfaEnabled).toHaveBeenCalledWith(
      "at",
      "u1",
      true,
    );
  });
});
