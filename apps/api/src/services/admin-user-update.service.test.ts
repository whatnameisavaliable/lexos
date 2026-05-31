import { describe, expect, it, vi } from "vitest";
import { ErrorCode } from "@lexos/shared/api";
import { AdminUserUpdateService } from "./admin-user-update.service.js";

describe("AdminUserUpdateService", () => {
  const adminUserRepository = {
    findUserById: vi.fn(),
    updateProfileFields: vi.fn(),
  };
  const auditWriterService = { write: vi.fn() };
  const service = new AdminUserUpdateService(
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

  it("updates profile and audits", async () => {
    adminUserRepository.findUserById.mockResolvedValue({
      id: "u1",
      username: "lawyer",
      displayName: "Old",
      role: "lawyer",
      contact: null,
      status: "enabled",
      requiresPasswordChange: false,
      mfaEnabled: false,
      createdAt: "t",
      updatedAt: "t",
    });
    adminUserRepository.updateProfileFields.mockResolvedValue({
      id: "u1",
      username: "lawyer",
      displayName: "New",
      role: "lawyer",
      contact: null,
      status: "enabled",
      requiresPasswordChange: false,
      mfaEnabled: false,
      createdAt: "t",
      updatedAt: "t",
    });
    auditWriterService.write.mockResolvedValue("a1");

    const result = await service.update(actor, "u1", { displayName: "New" });
    expect(result.displayName).toBe("New");
    expect(auditWriterService.write).toHaveBeenCalledWith(
      expect.objectContaining({ action: "user.update" }),
      expect.any(Object),
    );
  });

  it("returns not found for missing user", async () => {
    adminUserRepository.findUserById.mockResolvedValue(null);
    await expect(
      service.update(actor, "missing", { displayName: "X" }),
    ).rejects.toMatchObject({ code: ErrorCode.RESOURCE_NOT_FOUND });
  });
});
