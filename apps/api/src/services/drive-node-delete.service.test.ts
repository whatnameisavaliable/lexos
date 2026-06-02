import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { DriveNodeDeleteService } from "./drive-node-delete.service.js";

describe("DriveNodeDeleteService", () => {
  const audit = { write: vi.fn().mockResolvedValue("a1") };

  it("allows admin to delete another user's node via admin repository", async () => {
    const userRepo = {
      findById: vi.fn(),
      softDeleteSubtree: vi.fn(),
    };
    const adminRepo = {
      findById: vi.fn().mockResolvedValue({
        id: "n1",
        createdBy: "lawyer-1",
        nodeType: "file",
        name: "doc.pdf",
        parentId: "p1",
      }),
      softDeleteSubtree: vi.fn().mockResolvedValue(1),
    };
    const service = new DriveNodeDeleteService(
      userRepo as never,
      adminRepo as never,
      audit as never,
    );
    const actor = createAuthContext({
      userId: "admin-1",
      role: "admin",
      username: "admin",
      requiresPasswordChange: false,
    });

    const result = await service.delete(actor, "token", "n1");

    expect(result.deletedCount).toBe(1);
    expect(adminRepo.softDeleteSubtree).toHaveBeenCalledWith("n1");
    expect(userRepo.softDeleteSubtree).not.toHaveBeenCalled();
    expect(audit.write).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ deletedByAdmin: true }),
      }),
      expect.any(Object),
    );
  });

  it("lawyer deletes own subtree with cascade", async () => {
    const userRepo = {
      findById: vi.fn().mockResolvedValue({
        id: "f1",
        createdBy: "u1",
        nodeType: "folder",
        name: "docs",
        parentId: "root",
      }),
      softDeleteSubtree: vi.fn().mockResolvedValue(3),
    };
    const adminRepo = { findById: vi.fn(), softDeleteSubtree: vi.fn() };
    const service = new DriveNodeDeleteService(
      userRepo as never,
      adminRepo as never,
      audit as never,
    );
    const actor = createAuthContext({
      userId: "u1",
      role: "lawyer",
      username: "l",
      requiresPasswordChange: false,
    });

    const result = await service.delete(actor, "token", "f1");

    expect(result.deletedCount).toBe(3);
    expect(audit.write).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ cascade: true }),
      }),
      expect.any(Object),
    );
  });
});
