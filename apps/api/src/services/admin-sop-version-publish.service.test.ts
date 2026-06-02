import { describe, expect, it, vi } from "vitest";
import { LexosError, SopExecutionType } from "@lexos/shared";
import { AdminSopVersionPublishService } from "./admin-sop-version-publish.service.js";

const actor = {
  userId: "admin-id",
  role: "admin" as const,
  username: "admin",
  requiresPasswordChange: false,
};

describe("AdminSopVersionPublishService", () => {
  it("returns 422 when sync_llm step lacks prompt_template_id", async () => {
    const repository = {
      findTemplateVersionById: vi.fn().mockResolvedValue({
        versionId: "v1",
        templateId: "t1",
        isPublished: false,
        steps: [
          {
            stepCode: "A",
            dependsOn: [],
            executionType: SopExecutionType.SYNC_LLM,
            aiFeatureKey: "sop.fact_extract",
            promptTemplateId: null,
          },
        ],
      }),
      findPromptBodiesByIds: vi.fn(),
      hasFeatureMapping: vi.fn(),
      maxPublishedVersionNumber: vi.fn(),
      publishVersion: vi.fn(),
    };
    const auditWriterService = { write: vi.fn() };
    const service = new AdminSopVersionPublishService(
      repository as never,
      auditWriterService as never,
    );

    await expect(service.publish(actor, "v1")).rejects.toThrow(LexosError);
    expect(repository.publishVersion).not.toHaveBeenCalled();
  });
});
