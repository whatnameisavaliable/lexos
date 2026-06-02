import { describe, expect, it, vi } from "vitest";
import { LexosError } from "@lexos/shared";
import { AdminSopVersionCreateService } from "./admin-sop-version-create.service.js";

const actor = {
  userId: "admin-id",
  role: "admin" as const,
  username: "admin",
  requiresPasswordChange: false,
};

describe("AdminSopVersionCreateService", () => {
  it("creates draft from latest published version", async () => {
    const repository = {
      findTemplateById: vi.fn().mockResolvedValue({ templateId: "t1" }),
      findLatestPublishedVersionId: vi.fn().mockResolvedValue("v1"),
      copyVersionToNewDraft: vi.fn().mockResolvedValue("v2"),
    };
    const service = new AdminSopVersionCreateService(repository as never);
    const result = await service.create(actor, "t1", {});
    expect(result.versionId).toBe("v2");
  });

  it("throws when template missing", async () => {
    const repository = {
      findTemplateById: vi.fn().mockResolvedValue(null),
    };
    const service = new AdminSopVersionCreateService(repository as never);
    await expect(service.create(actor, "t1", {})).rejects.toThrow(LexosError);
  });
});
