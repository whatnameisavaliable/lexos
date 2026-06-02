import { describe, expect, it, vi } from "vitest";
import { LexosError } from "@lexos/shared";
import { AdminSopVersionGetService } from "./admin-sop-version-get.service.js";

describe("AdminSopVersionGetService", () => {
  it("throws when version not found", async () => {
    const repository = {
      findTemplateVersionById: vi.fn().mockResolvedValue(null),
    };
    const service = new AdminSopVersionGetService(repository as never);
    await expect(service.getVersion("missing")).rejects.toThrow(LexosError);
  });
});
