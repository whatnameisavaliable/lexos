import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorCode } from "@lexos/shared/api";
import { AdminUserResetPasswordService } from "./admin-user-reset-password.service.js";

describe("AdminUserResetPasswordService", () => {
  const authAdapter = {
    adminUpdateUserPassword: vi.fn(),
    adminSignOutGlobal: vi.fn(),
  };
  const adminUserRepository = {
    findUserById: vi.fn(),
    applyPasswordResetAudit: vi.fn(),
  };

  const service = new AdminUserResetPasswordService(
    authAdapter as never,
    adminUserRepository as never,
    "reset-pass",
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const actor = {
    userId: "admin-id",
    username: "admin",
    role: "admin" as const,
    requiresPasswordChange: false,
    mfaEnabled: false,
    status: "enabled" as const,
  };

  it("resets password, audits in DB txn, and signs out", async () => {
    adminUserRepository.findUserById.mockResolvedValue({
      id: "u1",
      username: "lawyer",
    });
    adminUserRepository.applyPasswordResetAudit.mockResolvedValue(undefined);
    authAdapter.adminUpdateUserPassword.mockResolvedValue(undefined);
    authAdapter.adminSignOutGlobal.mockResolvedValue(undefined);

    const result = await service.resetPassword(actor, "u1");

    expect(result.ok).toBe(true);
    expect(authAdapter.adminUpdateUserPassword).toHaveBeenCalledWith(
      "u1",
      "reset-pass",
    );
    expect(adminUserRepository.applyPasswordResetAudit).toHaveBeenCalled();
    expect(authAdapter.adminSignOutGlobal).toHaveBeenCalledWith("u1");
  });

  it("does not sign out when audit transaction fails", async () => {
    adminUserRepository.findUserById.mockResolvedValue({ id: "u1" });
    authAdapter.adminUpdateUserPassword.mockResolvedValue(undefined);
    adminUserRepository.applyPasswordResetAudit.mockRejectedValue(
      new Error("db"),
    );

    await expect(service.resetPassword(actor, "u1")).rejects.toMatchObject({
      code: ErrorCode.INTERNAL_ERROR,
    });
    expect(authAdapter.adminSignOutGlobal).not.toHaveBeenCalled();
  });
});
