import { describe, expect, it, vi } from "vitest";
import { LexosError } from "@lexos/shared";
import { AdminSopTemplateGetService } from "./admin-sop-template-get.service.js";

describe("AdminSopTemplateGetService", () => {
  it("throws when template not found", async () => {
    const repository = {
      findTemplateById: vi.fn().mockResolvedValue(null),
    };
    const service = new AdminSopTemplateGetService(repository as never);
    await expect(service.getTemplate("missing")).rejects.toThrow(LexosError);
  });
});
