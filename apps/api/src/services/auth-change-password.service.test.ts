import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { AuthChangePasswordService } from "./auth-change-password.service.js";

describe("AuthChangePasswordService", () => {
  const authAdapter = {
    signInWithPassword: vi.fn(),
    updateUserPasswordAsAdmin: vi.fn(),
  };
  const profileAdminRepository = {
    setRequiresPasswordChange: vi.fn(),
  };
  const auditWriterService = { write: vi.fn() };

  const service = new AuthChangePasswordService(
    authAdapter as never,
    profileAdminRepository as never,
    auditWriterService as never,
  );

  it("skips current password when requiresPasswordChange", async () => {
    authAdapter.updateUserPasswordAsAdmin.mockResolvedValue(undefined);
    profileAdminRepository.setRequiresPasswordChange.mockResolvedValue(undefined);
    authAdapter.signInWithPassword.mockResolvedValue({
      accessToken: "new-at",
      refreshToken: "rt",
      userId: "u1",
      sessionId: undefined,
      expiresAt: 1,
    });
    auditWriterService.write.mockResolvedValue("id");

    const result = await service.changePassword(
      createAuthContext({
        userId: "u1",
        role: "admin",
        username: "admin",
        requiresPasswordChange: true,
      }),
      "at",
      { newPassword: "new-password-1" },
    );

    expect(authAdapter.signInWithPassword).toHaveBeenCalledWith(
      "admin",
      "new-password-1",
    );
    expect(profileAdminRepository.setRequiresPasswordChange).toHaveBeenCalledWith(
      "u1",
      false,
    );
    expect(result.accessToken).toBe("new-at");
  });
});
