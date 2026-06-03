import { describe, expect, it, vi } from "vitest";
import { AiFeatureKey } from "@lexos/shared";
import { SopMediaOcrService } from "./sop-media-ocr.service.js";

describe("SopMediaOcrService.transcribeMediaFile", () => {
  it("invokes asr_physical orchestration", async () => {
    const aiOrchestration = {
      invoke: vi.fn().mockResolvedValue({ text: "hello" }),
    };
    const service = new SopMediaOcrService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      aiOrchestration as never,
      "/tmp",
    );

    const text = await service.transcribeMediaFile({} as never, {
      stage: "sop.media.ocr",
      pipeline_id: "p1",
      step_code: "01-A",
    }, "/tmp/a.mp3");

    expect(text).toBe("hello");
    expect(aiOrchestration.invoke).toHaveBeenCalledWith(
      expect.objectContaining({
        featureKey: AiFeatureKey.ASR_PHYSICAL,
        transcribePath: "/tmp/a.mp3",
      }),
    );
  });
});
