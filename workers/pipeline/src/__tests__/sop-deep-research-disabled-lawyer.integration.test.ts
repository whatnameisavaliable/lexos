import { describe, expect, it, vi } from "vitest";
import { createMockPool } from "../test/pg-test-helpers.js";
import { SopDeepResearchService } from "../services/sop-deep-research.service.js";

describe("SOP deep research disabled lawyer integration", () => {
  it("does not invoke LLM when lawyer pipeline is not writable", async () => {
    const pipelineRepository = {
      assertLawyerPipelineWritable: vi
        .fn()
        .mockRejectedValue(new Error("lawyer disabled")),
    };
    const llmOrchestration = { invoke: vi.fn() };
    const service = new SopDeepResearchService(
      { sopDeepResearchTimeoutMs: 1000 },
      pipelineRepository as never,
      { setArtifactStatus: vi.fn() } as never,
      { isDeepResearchEnabled: vi.fn().mockResolvedValue(true) } as never,
      {} as never,
      llmOrchestration as never,
    );

    await expect(
      service.run(createMockPool(), {
        stage: "sop.deep_research",
        pipeline_id: "pipe-1",
        step_code: "02-B",
        artifact_id: "art-1",
      }),
    ).rejects.toThrow(/lawyer disabled/);

    expect(llmOrchestration.invoke).not.toHaveBeenCalled();
  });
});
