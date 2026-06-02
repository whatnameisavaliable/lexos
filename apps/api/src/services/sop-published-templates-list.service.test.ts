import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { SopPublishedTemplatesListService } from "./sop-published-templates-list.service.js";

describe("SopPublishedTemplatesListService", () => {
  it("lists published templates with parsed limit", async () => {
    const repository = {
      listPublishedTemplates: vi.fn().mockResolvedValue({
        items: [
          {
            templateVersionId: "v1",
            templateName: "模板",
            caseType: "civil",
            versionNumber: 1,
          },
        ],
      }),
    };
    const service = new SopPublishedTemplatesListService(repository as never);
    const actor = createAuthContext({
      userId: "u1",
      role: "lawyer",
      username: "lawyer1",
      requiresPasswordChange: false,
    });

    const result = await service.list(actor, "token", { limit: "20" });

    expect(repository.listPublishedTemplates).toHaveBeenCalledWith("token", {
      limit: 20,
      cursor: undefined,
    });
    expect(result.items).toHaveLength(1);
  });
});
