import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { parseAdminSopPreviewPipelineBody } from "./admin-sop-preview-pipeline.dto.js";

describe("adminSopPreviewPipelineBodySchema", () => {
  it("accepts minimal preview payload", () => {
    const body = parseAdminSopPreviewPipelineBody({
      templateVersionId: "00000000-0000-4000-8000-000000000010",
      stepCode: "02-B",
    });
    expect(body.formValues).toEqual({});
    expect(body.finalizedArtifacts).toEqual([]);
    expect(body.sopMediaExtractedText).toBe("");
  });

  it("rejects missing templateVersionId", () => {
    expect(() =>
      parseAdminSopPreviewPipelineBody({
        stepCode: "01-A",
      }),
    ).toThrow(ZodError);
  });
});
