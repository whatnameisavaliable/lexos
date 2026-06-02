import { describe, expect, it } from "vitest";
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
