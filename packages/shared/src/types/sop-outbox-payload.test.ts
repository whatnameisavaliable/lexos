import { describe, expect, it } from "vitest";
import { parseSopOutboxPayload } from "./parse-sop-outbox-payload.js";
import {
  SOP_OUTBOX_AGGREGATE_TYPE,
  type SopOutboxPayload,
} from "./sop-outbox-payload.js";

describe("SopOutboxPayload", () => {
  it("documents aggregate_type as case_pipeline", () => {
    expect(SOP_OUTBOX_AGGREGATE_TYPE).toBe("case_pipeline");
  });

  it("accepts optional artifact_id", () => {
    const payload: SopOutboxPayload = {
      stage: "sop.deep_research",
      pipeline_id: "00000000-0000-4000-8000-000000000001",
      step_code: "02-B",
      artifact_id: "00000000-0000-4000-8000-000000000002",
    };
    expect(payload.artifact_id).toBeDefined();
  });
});

describe("parseSopOutboxPayload — required field validation", () => {
  it("throws when payload is not an object", () => {
    expect(() => parseSopOutboxPayload(null)).toThrow(/Invalid outbox payload/);
  });

  it("throws when stage is missing or invalid", () => {
    expect(() =>
      parseSopOutboxPayload({
        pipeline_id: "p1",
        step_code: "01-A",
      }),
    ).toThrow(/Unknown SOP stage/);
  });

  it("throws when pipeline_id is missing", () => {
    expect(() =>
      parseSopOutboxPayload({
        stage: "sop.media.ocr",
        step_code: "01-A",
      }),
    ).toThrow(/Invalid outbox payload pipeline_id/);
  });

  it("throws when step_code is missing", () => {
    expect(() =>
      parseSopOutboxPayload({
        stage: "sop.media.ocr",
        pipeline_id: "p1",
      }),
    ).toThrow(/Invalid outbox payload step_code/);
  });

  it("throws when deep_research lacks artifact_id", () => {
    expect(() =>
      parseSopOutboxPayload({
        stage: "sop.deep_research",
        pipeline_id: "p1",
        step_code: "02-B",
      }),
    ).toThrow(/Invalid outbox payload artifact_id/);
  });
});
