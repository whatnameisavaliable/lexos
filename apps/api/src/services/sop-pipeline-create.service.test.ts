import { describe, expect, it, vi } from "vitest";
import { createAuthContext } from "@lexos/shared";
import { AppHttpError } from "../middleware/error-handler.middleware.js";
import { SopPipelineCreateService } from "./sop-pipeline-create.service.js";

describe("SopPipelineCreateService", () => {
  it("throws OPERATION_NOT_ALLOWED when template version is unpublished", async () => {
    const templateReadRepository = {
      listPublishedTemplates: vi.fn().mockResolvedValue({ items: [] }),
    };
    const stepSnapshotRepository = {
      listStepsByTemplateVersionId: vi.fn(),
    };
    const casePipelineRepository = {
      createPipeline: vi.fn(),
    };
    const service = new SopPipelineCreateService(
      templateReadRepository as never,
      stepSnapshotRepository as never,
      casePipelineRepository as never,
    );
    const actor = createAuthContext({
      userId: "u1",
      role: "lawyer",
      username: "lawyer1",
      requiresPasswordChange: false,
    });

    await expect(
      service.create(actor, "token", {
        templateVersionId: "00000000-0000-4000-8000-000000000101",
      }),
    ).rejects.toBeInstanceOf(AppHttpError);
  });
});
