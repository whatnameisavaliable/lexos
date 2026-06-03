import { describe, expect, it, vi } from "vitest";
import type { SopOutboxPayload } from "@lexos/shared";
import { createMockPool } from "../test/pg-test-helpers.js";
import { SopMediaOcrService } from "./sop-media-ocr.service.js";

function createService(overrides: Partial<Record<string, unknown>> = {}) {
  const pipelineRepository = {
    assertLawyerPipelineWritable: vi.fn().mockResolvedValue(undefined),
    findPipelineWithLawyer: vi.fn().mockResolvedValue({
      id: "pipe-1",
      lawyerId: "lawyer-1",
    }),
  };
  const artifactRepository = {
    upsertMediaExtractedText: vi.fn().mockResolvedValue(undefined),
  };
  const mediaRepository = {
    listMediaObjectKeys: vi.fn().mockResolvedValue(["lawyer-1/sops/pipe-1/a.mp3"]),
  };
  const uploadSessionRepository = {
    findStorageKeyPrefix: vi.fn(),
  };
  const storage = {
    downloadToFile: vi.fn().mockResolvedValue(undefined),
  };
  const aiOrchestration = {
    invoke: vi.fn().mockResolvedValue({ text: "transcribed" }),
  };

  const service = new SopMediaOcrService(
    pipelineRepository as never,
    artifactRepository as never,
    mediaRepository as never,
    uploadSessionRepository as never,
    storage as never,
    aiOrchestration as never,
    "/tmp/lexos",
  );

  return {
    service,
    pipelineRepository,
    artifactRepository,
    mediaRepository,
    storage,
    aiOrchestration,
    ...overrides,
  };
}

describe("SopMediaOcrService", () => {
  const payload: SopOutboxPayload = {
    stage: "sop.media.ocr",
    pipeline_id: "pipe-1",
    step_code: "01-A",
    storage_key_prefix: "lawyer-1/sops/pipe-1/",
  };

  it("runs end-to-end with mocked dependencies", async () => {
    const { service, artifactRepository, storage } = createService();
    const pool = createMockPool();

    await service.run(pool, payload);

    expect(storage.downloadToFile).toHaveBeenCalled();
    expect(artifactRepository.upsertMediaExtractedText).toHaveBeenCalledWith(
      expect.anything(),
      "pipe-1",
      expect.stringContaining("--- a.mp3 ---"),
    );
  });
});
