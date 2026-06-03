import { describe, expect, it, vi } from "vitest";
import { SopMediaOcrService } from "./sop-media-ocr.service.js";

describe("SopMediaOcrService.downloadMediaObjectToTemp", () => {
  it("delegates to storage adapter", async () => {
    const storage = { downloadToFile: vi.fn().mockResolvedValue(undefined) };
    const service = new SopMediaOcrService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      storage as never,
      {} as never,
      "/tmp",
    );

    await service.downloadMediaObjectToTemp("key/a.mp3", "/tmp/a.mp3");
    expect(storage.downloadToFile).toHaveBeenCalledWith("key/a.mp3", "/tmp/a.mp3");
  });
});
