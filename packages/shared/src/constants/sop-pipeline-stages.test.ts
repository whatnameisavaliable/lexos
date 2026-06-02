import { describe, expect, it } from "vitest";
import {
  SOP_PIPELINE_STAGES,
  SOP_STAGE_DEEP_RESEARCH,
  SOP_STAGE_MEDIA_OCR,
  SOP_STAGE_PDF_EXPORT,
  isSopPipelineStage,
} from "./sop-pipeline-stages.js";

describe("sop-pipeline-stages", () => {
  it("matches architecture.md §3.2.6.2 stage names", () => {
    expect(SOP_PIPELINE_STAGES).toEqual([
      SOP_STAGE_MEDIA_OCR,
      SOP_STAGE_DEEP_RESEARCH,
      SOP_STAGE_PDF_EXPORT,
    ]);
    expect(SOP_STAGE_MEDIA_OCR).toBe("sop.media.ocr");
    expect(SOP_STAGE_DEEP_RESEARCH).toBe("sop.deep_research");
    expect(SOP_STAGE_PDF_EXPORT).toBe("sop.pdf_export");
  });

  it("isSopPipelineStage narrows known values", () => {
    expect(isSopPipelineStage("sop.media.ocr")).toBe(true);
    expect(isSopPipelineStage("sop.deep_research")).toBe(true);
    expect(isSopPipelineStage("sop.pdf_export")).toBe(true);
    expect(isSopPipelineStage("asr")).toBe(false);
  });
});
