import { describe, expect, it, vi } from "vitest";
import { createMockPool } from "../test/pg-test-helpers.js";
import { SopDeepResearchService } from "./sop-deep-research.service.js";

describe("SopDeepResearchService.runWithTimeout", () => {
  it("rejects when promise exceeds timeout", async () => {
    vi.useFakeTimers();
    const service = new SopDeepResearchService(
      { sopDeepResearchTimeoutMs: 50 },
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const promise = service.runWithTimeout(
      new Promise<string>(() => {
        /* never resolves */
      }),
      50,
    );
    const expectation = expect(promise).rejects.toThrow(/timed out/);
    await vi.advanceTimersByTimeAsync(60);
    await expectation;
    vi.useRealTimers();
  });
});

describe("SopDeepResearchService timeout marks failed", () => {
  it("sets artifact failed when run times out", async () => {
    vi.useFakeTimers();
    const artifactRepository = {
      setArtifactStatus: vi.fn().mockResolvedValue(undefined),
      setContentRaw: vi.fn(),
      loadMediaExtractedText: vi.fn().mockResolvedValue(""),
    };
    const service = new SopDeepResearchService(
      { sopDeepResearchTimeoutMs: 30 },
      {
        assertLawyerPipelineWritable: vi.fn(),
        findPipelineWithLawyer: vi.fn().mockResolvedValue({
          templateVersionId: "tv",
        }),
      } as never,
      artifactRepository as never,
      { isDeepResearchEnabled: vi.fn().mockResolvedValue(true) } as never,
      {
        findStepByTemplateVersion: vi.fn().mockResolvedValue({
          promptTemplateId: "p1",
          dependsOn: [],
        }),
        findPromptSystemTemplate: vi.fn().mockResolvedValue("x"),
        loadFinalizedArtifactContents: vi.fn().mockResolvedValue({}),
      } as never,
      {
        invoke: vi.fn(() => new Promise(() => undefined)),
      } as never,
    );

    const runPromise = service.run(createMockPool(), {
      stage: "sop.deep_research",
      pipeline_id: "p1",
      step_code: "02-B",
      artifact_id: "a1",
    });
    const expectation = expect(runPromise).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(40);
    await expectation;
    expect(artifactRepository.setArtifactStatus).toHaveBeenCalledWith(
      expect.anything(),
      "a1",
      "failed",
    );
    vi.useRealTimers();
  });
});
