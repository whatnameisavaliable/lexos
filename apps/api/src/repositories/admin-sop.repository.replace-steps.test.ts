import { describe, expect, it, vi } from "vitest";
import { AdminSopRepository } from "./admin-sop.repository.js";

describe("AdminSopRepository.replaceDraftSteps", () => {
  it("deletes existing steps then inserts new rows", async () => {
    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    const insert = vi.fn().mockResolvedValue({ error: null });

    const from = vi.fn((table: string) => {
      if (table === "sop_steps") {
        return {
          delete: () => ({ eq: deleteEq }),
          insert,
        };
      }
      return {};
    });

    const repo = new AdminSopRepository({ from } as never);
    await repo.replaceDraftSteps("v1", [
      {
        stepCode: "A",
        name: "Entry",
        executionType: "manual",
        inputSchema: {},
        dependsOn: [],
        requiresVerification: false,
      },
    ]);

    expect(deleteEq).toHaveBeenCalledWith("template_version_id", "v1");
    expect(insert).toHaveBeenCalled();
  });
});
