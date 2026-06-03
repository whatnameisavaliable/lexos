import { describe, expect, it, vi } from "vitest";
import { SopDeepResearchService } from "./sop-deep-research.service.js";

describe("SopDeepResearchService artifact status writers", () => {
  it("writeDraftArtifact sets content and draft status", async () => {
    const artifactRepository = {
      setContentRaw: vi.fn(),
      setArtifactStatus: vi.fn(),
    };
    const service = new SopDeepResearchService(
      { sopDeepResearchTimeoutMs: 1000 },
      {} as never,
      artifactRepository as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await service.writeDraftArtifact({} as never, "a1", "md");
    expect(artifactRepository.setContentRaw).toHaveBeenCalledWith(
      expect.anything(),
      "a1",
      "md",
    );
    expect(artifactRepository.setArtifactStatus).toHaveBeenCalledWith(
      expect.anything(),
      "a1",
      "draft",
    );
  });

  it("writeFailedArtifact sets failed status", async () => {
    const artifactRepository = {
      setArtifactStatus: vi.fn(),
    };
    const service = new SopDeepResearchService(
      { sopDeepResearchTimeoutMs: 1000 },
      {} as never,
      artifactRepository as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await service.writeFailedArtifact({} as never, "a1", "err");
    expect(artifactRepository.setArtifactStatus).toHaveBeenCalledWith(
      expect.anything(),
      "a1",
      "failed",
    );
  });
});
