import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { AuthChangePasswordService } from "./auth-change-password.service.js";

describe("AuthChangePasswordService", () => {
  const authAdapter = {
    signInWithPassword: vi.fn(),
    updateUserPasswordWithSession: vi.fn(),
  };
  const profileAdminRepository = {
    completePasswordChange: vi.fn(),
  };
  const auditLogRepository = { append: vi.fn() };

  const service = new AuthChangePasswordService(
    authAdapter as never,
    profileAdminRepository as never,
    auditLogRepository as never,
  );

  it("skips current password when requiresPasswordChange", async () => {
    authAdapter.updateUserPasswordWithSession.mockResolvedValue(undefined);
    profileAdminRepository.completePasswordChange.mockResolvedValue(undefined);
    auditLogRepository.append.mockResolvedValue("id");

    await service.changePassword(
      createAuthContext({
        userId: "u1",
        role: "admin",
        username: "admin",
        requiresPasswordChange: true,
      }),
      "at",
      { newPassword: "new-password-1" },
    );

    expect(authAdapter.signInWithPassword).not.toHaveBeenCalled();
    expect(profileAdminRepository.completePasswordChange).toHaveBeenCalled();
  });
});
