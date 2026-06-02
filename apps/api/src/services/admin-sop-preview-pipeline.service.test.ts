import { describe, expect, it, vi } from "vitest";
import { SopExecutionType } from "@lexos/shared";
import { AdminSopPreviewPipelineService } from "./admin-sop-preview-pipeline.service.js";

describe("AdminSopPreviewPipelineService", () => {
  it("does not call insertPipeline on repository", async () => {
    const adminSopRepository = {
      findTemplateVersionById: vi.fn().mockResolvedValue({
        versionId: "v1",
        templateId: "t1",
        steps: [
          {
            stepCode: "A",
            executionType: SopExecutionType.SYNC_LLM,
            aiFeatureKey: "sop.fact_extract",
            promptTemplateId: "p1",
          },
        ],
      }),
    };
    const aiPromptRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "p1",
        system_prompt: "{{sop_media_extracted_text}}",
      }),
    };
    const sopAiOrchestrationService = {
      invokeSopLlm: vi.fn().mockResolvedValue({
        content: "preview output",
        modelId: "m1",
        isFallback: false,
        latencyMs: 10,
      }),
    };

    const service = new AdminSopPreviewPipelineService(
      adminSopRepository as never,
      aiPromptRepository as never,
      sopAiOrchestrationService as never,
    );

    const result = await service.preview({
      templateVersionId: "v1",
      stepCode: "A",
      formValues: {},
      finalizedArtifacts: [],
      sopMediaExtractedText: "hello",
    });

    expect(result.content).toBe("preview output");
    expect(adminSopRepository.findTemplateVersionById).toHaveBeenCalled();
    expect(
      "insertPipeline" in adminSopRepository,
    ).toBe(false);
  });
});
