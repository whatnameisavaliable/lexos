import { describe, expect, it, vi } from "vitest";
import { ErrorCode } from "@lexos/shared/api";
import { AdminUserStatusService } from "./admin-user-status.service.js";

describe("AdminUserStatusService", () => {
  const authAdapter = { adminSignOutGlobal: vi.fn() };
  const adminUserRepository = {
    findUserById: vi.fn(),
    countEnabledAdmins: vi.fn(),
    setUserStatus: vi.fn(),
  };
  const auditWriterService = { write: vi.fn() };

  const service = new AdminUserStatusService(
    authAdapter as never,
    adminUserRepository as never,
    auditWriterService as never,
  );

  const actor = {
    userId: "admin-id",
    username: "admin",
    role: "admin" as const,
    requiresPasswordChange: false,
    mfaEnabled: false,
    status: "enabled" as const,
  };

  it("disables user and signs out globally", async () => {
    adminUserRepository.findUserById.mockResolvedValue({
      id: "u1",
      username: "lawyer",
      displayName: "L",
      role: "lawyer",
      status: "enabled",
      requiresPasswordChange: false,
      mfaEnabled: false,
      contact: null,
      createdAt: "t",
      updatedAt: "t",
    });
    adminUserRepository.setUserStatus.mockResolvedValue({
      id: "u1",
      username: "lawyer",
      displayName: "L",
      role: "lawyer",
      status: "disabled",
      requiresPasswordChange: false,
      mfaEnabled: false,
      contact: null,
      createdAt: "t",
      updatedAt: "t",
    });
    auditWriterService.write.mockResolvedValue("a1");

    await service.setStatus(actor, "u1", { status: "disabled" });

    expect(authAdapter.adminSignOutGlobal).toHaveBeenCalledWith("u1");
    expect(auditWriterService.write).toHaveBeenCalledWith(
      expect.objectContaining({ action: "user.disable" }),
      expect.any(Object),
    );
  });

  it("blocks disabling built-in admin", async () => {
    adminUserRepository.findUserById.mockResolvedValue({
      id: "u1",
      username: "admin",
      role: "admin",
      status: "enabled",
    });

    await expect(
      service.setStatus(actor, "u1", { status: "disabled" }),
    ).rejects.toMatchObject({ code: ErrorCode.OPERATION_NOT_ALLOWED });
  });

  it("blocks disabling last enabled admin", async () => {
    adminUserRepository.findUserById.mockResolvedValue({
      id: "u2",
      username: "admin2",
      role: "admin",
      status: "enabled",
    });
    adminUserRepository.countEnabledAdmins.mockResolvedValue(1);

    await expect(
      service.setStatus(actor, "u2", { status: "disabled" }),
    ).rejects.toMatchObject({ code: ErrorCode.OPERATION_NOT_ALLOWED });
  });
});
