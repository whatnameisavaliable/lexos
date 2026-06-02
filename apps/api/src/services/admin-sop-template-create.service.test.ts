import { describe, expect, it, vi } from "vitest";
import { LexosError } from "@lexos/shared";
import { AdminSopTemplateCreateService } from "./admin-sop-template-create.service.js";

const actor = {
  userId: "admin-id",
  role: "admin" as const,
  username: "admin",
  requiresPasswordChange: false,
};

describe("AdminSopTemplateCreateService", () => {
  it("rejects invalid DAG with VALIDATION_FAILED", async () => {
    const repository = {
      insertTemplateWithInitialDraft: vi.fn(),
    };
    const service = new AdminSopTemplateCreateService(repository as never);

    await expect(
      service.create(actor, {
        name: "SOP",
        caseType: "civil",
        steps: [
          {
            stepCode: "A",
            name: "A",
            executionType: "manual",
            inputSchema: {},
            dependsOn: [],
            requiresVerification: false,
          },
          {
            stepCode: "B",
            name: "B",
            executionType: "manual",
            inputSchema: {},
            dependsOn: [],
            requiresVerification: false,
          },
        ],
      }),
    ).rejects.toThrow(LexosError);

    expect(repository.insertTemplateWithInitialDraft).not.toHaveBeenCalled();
  });
});
