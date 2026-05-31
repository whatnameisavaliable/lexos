import { describe, expect, it, vi } from "vitest";
import { ErrorCode } from "@lexos/shared/api";
import { AdminUserCreateService } from "./admin-user-create.service.js";
import { AppHttpError } from "../middleware/error-handler.middleware.js";

describe("AdminUserCreateService", () => {
  const authAdapter = {
    resolveVirtualEmail: vi.fn(() => "u@llexos.internal"),
    adminCreateUser: vi.fn(),
    adminDeleteUser: vi.fn(),
  };
  const adminUserRepository = {
    findUserByUsername: vi.fn(),
    insertProfileAfterAuth: vi.fn(),
    seedDriveRootFolder: vi.fn(),
    deleteProfile: vi.fn(),
  };
  const auditWriterService = { write: vi.fn() };

  const actor = {
    userId: "admin-id",
    username: "admin",
    role: "admin" as const,
    requiresPasswordChange: false,
    mfaEnabled: false,
    status: "enabled" as const,
  };

  const service = new AdminUserCreateService(
    authAdapter as never,
    adminUserRepository as never,
    auditWriterService as never,
    "initial-pass",
  );

  it("creates user and writes audit", async () => {
    adminUserRepository.findUserByUsername.mockResolvedValue(null);
    authAdapter.adminCreateUser.mockResolvedValue({ userId: "new-id" });
    adminUserRepository.insertProfileAfterAuth.mockResolvedValue({
      id: "new-id",
      username: "lawyer1",
      displayName: "L",
      role: "lawyer",
      contact: null,
      status: "enabled",
      requiresPasswordChange: false,
      mfaEnabled: false,
      createdAt: "t",
      updatedAt: "t",
    });
    adminUserRepository.seedDriveRootFolder.mockResolvedValue(undefined);
    auditWriterService.write.mockResolvedValue("audit-1");

    const result = await service.create(actor, {
      username: "lawyer1",
      displayName: "L",
      role: "lawyer",
    });

    expect(result.username).toBe("lawyer1");
    expect(auditWriterService.write).toHaveBeenCalledWith(
      expect.objectContaining({ action: "user.create", targetId: "new-id" }),
      expect.any(Object),
    );
  });

  it("rejects duplicate username", async () => {
    adminUserRepository.findUserByUsername.mockResolvedValue({ id: "x" });

    await expect(
      service.create(actor, {
        username: "dup",
        displayName: "D",
        role: "lawyer",
      }),
    ).rejects.toMatchObject({
      code: ErrorCode.VALIDATION_FAILED,
    } satisfies Partial<AppHttpError>);
  });

  it("rolls back auth user when profile insert fails", async () => {
    adminUserRepository.findUserByUsername.mockResolvedValue(null);
    authAdapter.adminCreateUser.mockResolvedValue({ userId: "new-id" });
    adminUserRepository.insertProfileAfterAuth.mockRejectedValue(
      new Error("db"),
    );
    adminUserRepository.deleteProfile.mockResolvedValue(undefined);
    authAdapter.adminDeleteUser.mockResolvedValue(undefined);

    await expect(
      service.create(actor, {
        username: "lawyer2",
        displayName: "L",
        role: "lawyer",
      }),
    ).rejects.toThrow("db");

    expect(adminUserRepository.deleteProfile).toHaveBeenCalledWith("new-id");
    expect(authAdapter.adminDeleteUser).toHaveBeenCalledWith("new-id");
  });
});
