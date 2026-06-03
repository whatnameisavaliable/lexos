import { describe, expect, it } from "vitest";
import {
  isSopPipelineStage,
  parseSopOutboxPayload,
  parseWorkerOutboxPayload,
  type SopOutboxPayload,
} from "./index.js";

describe("M14 shared package exports", () => {
  it("re-exports SOP outbox parse helpers", () => {
    expect(typeof parseSopOutboxPayload).toBe("function");
    expect(typeof parseWorkerOutboxPayload).toBe("function");
    expect(typeof isSopPipelineStage).toBe("function");
  });

  it("parseWorkerOutboxPayload resolves SopOutboxPayload type", () => {
    const payload: SopOutboxPayload = parseSopOutboxPayload({
      stage: "sop.media.ocr",
      pipeline_id: "p1",
      step_code: "01-A",
    });
    expect(payload.stage).toBe("sop.media.ocr");
  });
});
