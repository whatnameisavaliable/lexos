import { describe, expect, it, vi } from "vitest";
import type { SopOutboxPayload } from "@lexos/shared";
import { createMockPool } from "../test/pg-test-helpers.js";
import { SopDeepResearchService } from "./sop-deep-research.service.js";

function createService() {
  const pipelineRepository = {
    assertLawyerPipelineWritable: vi.fn().mockResolvedValue(undefined),
    findPipelineWithLawyer: vi.fn().mockResolvedValue({
      id: "pipe-1",
      lawyerId: "lawyer-1",
      templateVersionId: "tv-1",
    }),
  };
  const artifactRepository = {
    setArtifactStatus: vi.fn().mockResolvedValue(undefined),
    setContentRaw: vi.fn().mockResolvedValue(undefined),
    loadMediaExtractedText: vi.fn().mockResolvedValue("media"),
  };
  const settingsRepository = {
    isDeepResearchEnabled: vi.fn().mockResolvedValue(true),
  };
  const promptRepository = {
    findStepByTemplateVersion: vi.fn().mockResolvedValue({
      stepCode: "02-B",
      promptTemplateId: "prompt-1",
      dependsOn: [],
    }),
    findPromptSystemTemplate: vi.fn().mockResolvedValue("Research {{sop_media_extracted_text}}"),
    loadFinalizedArtifactContents: vi.fn().mockResolvedValue({}),
  };
  const llmOrchestration = {
    invoke: vi.fn().mockResolvedValue({ text: "# report" }),
  };

  const service = new SopDeepResearchService(
    { sopDeepResearchTimeoutMs: 60_000 },
    pipelineRepository as never,
    artifactRepository as never,
    settingsRepository as never,
    promptRepository as never,
    llmOrchestration as never,
    vi.fn().mockResolvedValue(false),
  );

  return {
    service,
    artifactRepository,
    settingsRepository,
    llmOrchestration,
  };
}

describe("SopDeepResearchService", () => {
  const payload: SopOutboxPayload = {
    stage: "sop.deep_research",
    pipeline_id: "pipe-1",
    step_code: "02-B",
    artifact_id: "art-1",
  };

  it("writes draft artifact on success", async () => {
    const { service, artifactRepository, llmOrchestration } = createService();
    const pool = createMockPool();

    await service.run(pool, payload);

    expect(llmOrchestration.invoke).toHaveBeenCalled();
    expect(artifactRepository.setContentRaw).toHaveBeenCalledWith(
      expect.anything(),
      "art-1",
      "# report",
    );
    expect(artifactRepository.setArtifactStatus).toHaveBeenCalledWith(
      expect.anything(),
      "art-1",
      "draft",
    );
  });
});
