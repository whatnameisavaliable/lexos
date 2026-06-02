import { describe, expect, it } from "vitest";
import { assembleUserPrompt } from "./sop-prompt-assembler.service.js";

describe("assembleUserPrompt", () => {
  it("replaces sop_media_extracted_text placeholder", () => {
    const out = assembleUserPrompt("卷宗：{{sop_media_extracted_text}}", {
      finalizedArtifacts: [],
      formValues: {},
      sopMediaExtractedText: "OCR body",
    });
    expect(out).toBe("卷宗：OCR body");
  });
});
