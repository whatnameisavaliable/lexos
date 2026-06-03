import { describe, expect, it } from "vitest";
import { parseSopOutboxPayload } from "./parse-sop-outbox-payload.js";

describe("parseSopOutboxPayload", () => {
  it("accepts valid sop.deep_research sample", () => {
    const parsed = parseSopOutboxPayload({
      stage: "sop.deep_research",
      pipeline_id: "00000000-0000-4000-8000-000000000001",
      step_code: "01-B",
      artifact_id: "00000000-0000-4000-8000-000000000002",
      lawyer_id: "00000000-0000-4000-8000-000000000003",
    });

    expect(parsed).toEqual({
      stage: "sop.deep_research",
      pipeline_id: "00000000-0000-4000-8000-000000000001",
      step_code: "01-B",
      artifact_id: "00000000-0000-4000-8000-000000000002",
      lawyer_id: "00000000-0000-4000-8000-000000000003",
    });
  });

  it("accepts camelCase aliases", () => {
    const parsed = parseSopOutboxPayload({
      stage: "sop.pdf_export",
      pipelineId: "p1",
      stepCode: "03-A",
      artifactId: "a1",
      storageKeyPrefix: "u1/sops/p1/",
    });

    expect(parsed.pipeline_id).toBe("p1");
    expect(parsed.step_code).toBe("03-A");
    expect(parsed.artifact_id).toBe("a1");
    expect(parsed.storage_key_prefix).toBe("u1/sops/p1/");
  });
});
