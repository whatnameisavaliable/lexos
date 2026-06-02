import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { parseSopPipelineCreateBody } from "./sop-pipeline-create.dto.js";

describe("sopPipelineCreateBodySchema", () => {
  it("parses valid templateVersionId", () => {
    const id = "00000000-0000-4000-8000-000000000001";
    const body = parseSopPipelineCreateBody({ templateVersionId: id });
    expect(body.templateVersionId).toBe(id);
  });

  it("rejects non-UUID templateVersionId", () => {
    expect(() =>
      parseSopPipelineCreateBody({ templateVersionId: "not-a-uuid" }),
    ).toThrow(ZodError);
  });
});
