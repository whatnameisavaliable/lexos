import { SOP_STAGE_MEDIA_OCR } from "@lexos/shared";
import { describe, expect, it } from "vitest";
import { buildSopMediaOcrOutboxPayload } from "./build-sop-media-ocr-outbox-payload.js";

describe("buildSopMediaOcrOutboxPayload", () => {
  it("sets stage sop.media.ocr and upload_session_id", () => {
    const payload = buildSopMediaOcrOutboxPayload({
      pipelineId: "p-1",
      stepCode: "01",
      uploadSessionId: "sess-1",
    });
    expect(payload.stage).toBe(SOP_STAGE_MEDIA_OCR);
    expect(payload.upload_session_id).toBe("sess-1");
  });
});
