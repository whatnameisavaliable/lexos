import { SOP_STAGE_DEEP_RESEARCH } from "@lexos/shared";
import { describe, expect, it } from "vitest";
import { buildSopDeepResearchOutboxPayload } from "./build-sop-deep-research-outbox-payload.js";

describe("buildSopDeepResearchOutboxPayload", () => {
  it("sets stage sop.deep_research and artifact_id", () => {
    const payload = buildSopDeepResearchOutboxPayload({
      pipelineId: "p-1",
      stepCode: "01-B",
      artifactId: "a-1",
    });
    expect(payload.stage).toBe(SOP_STAGE_DEEP_RESEARCH);
    expect(payload.pipeline_id).toBe("p-1");
    expect(payload.step_code).toBe("01-B");
    expect(payload.artifact_id).toBe("a-1");
  });
});
