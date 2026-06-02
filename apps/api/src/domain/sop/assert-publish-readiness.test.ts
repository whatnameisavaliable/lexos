import { describe, expect, it } from "vitest";
import { LexosError } from "@lexos/shared";
import { SopExecutionType } from "@lexos/shared";
import { assertPublishReadiness } from "./assert-publish-readiness.js";

describe("assertPublishReadiness", () => {
  it("throws VALIDATION_FAILED when mapping is missing", () => {
    expect(() =>
      assertPublishReadiness(
        [
          {
            stepCode: "A",
            dependsOn: [],
            executionType: SopExecutionType.SYNC_LLM,
            aiFeatureKey: "sop.fact_extract",
            promptTemplateId: "00000000-0000-4000-8000-000000000001",
          },
        ],
        { A: "Hello" },
        () => false,
      ),
    ).toThrow(LexosError);
  });

  it("passes when mapping exists for sync_llm step", () => {
    expect(() =>
      assertPublishReadiness(
        [
          {
            stepCode: "A",
            dependsOn: [],
            executionType: SopExecutionType.SYNC_LLM,
            aiFeatureKey: "sop.fact_extract",
            promptTemplateId: "00000000-0000-4000-8000-000000000001",
          },
        ],
        { A: "Summarize facts" },
        () => true,
      ),
    ).not.toThrow();
  });
});
