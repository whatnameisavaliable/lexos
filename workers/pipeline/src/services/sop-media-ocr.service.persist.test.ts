import { describe, expect, it, vi } from "vitest";
import { SopMediaOcrService } from "./sop-media-ocr.service.js";

describe("SopMediaOcrService.persistSopMediaExtractedText", () => {
  it("writes media extracted text via artifact repository", async () => {
    const artifactRepository = {
      upsertMediaExtractedText: vi.fn().mockResolvedValue(undefined),
    };
    const service = new SopMediaOcrService(
      {} as never,
      artifactRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      "/tmp",
    );

    await service.persistSopMediaExtractedText({} as never, "pipe-1", "body");
    expect(artifactRepository.upsertMediaExtractedText).toHaveBeenCalledWith(
      expect.anything(),
      "pipe-1",
      "body",
    );
  });
});
