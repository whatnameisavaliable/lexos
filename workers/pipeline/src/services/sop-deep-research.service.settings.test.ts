import { describe, expect, it, vi } from "vitest";
import { createMockPool } from "../test/pg-test-helpers.js";
import { SopDeepResearchService } from "./sop-deep-research.service.js";

describe("SopDeepResearchService.assertDeepResearchEnabled", () => {
  it("reads worker system settings", async () => {
    const settingsRepository = {
      isDeepResearchEnabled: vi.fn().mockResolvedValue(false),
    };
    const artifactRepository = {
      setArtifactStatus: vi.fn().mockResolvedValue(undefined),
    };
    const service = new SopDeepResearchService(
      { sopDeepResearchTimeoutMs: 1000 },
      { assertLawyerPipelineWritable: vi.fn() } as never,
      artifactRepository as never,
      settingsRepository as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.run(createMockPool(), {
        stage: "sop.deep_research",
        pipeline_id: "p1",
        step_code: "02-B",
        artifact_id: "a1",
      }),
    ).resolves.toBeUndefined();

    expect(artifactRepository.setArtifactStatus).toHaveBeenCalledWith(
      expect.anything(),
      "a1",
      "failed",
    );
  });
});
