import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { parseAdminSopStepUpsert } from "./admin-sop-step-upsert.dto.js";

const baseManual = {
  stepCode: "01-A",
  name: "Collect facts",
  executionType: "manual",
  inputSchema: {},
  dependsOn: [],
  requiresVerification: false,
};

describe("adminSopStepUpsertSchema", () => {
  it("allows manual step without aiFeatureKey", () => {
    const step = parseAdminSopStepUpsert(baseManual);
    expect(step.aiFeatureKey).toBeUndefined();
  });

  it("requires aiFeatureKey for sync_llm", () => {
    expect(() =>
      parseAdminSopStepUpsert({
        ...baseManual,
        executionType: "sync_llm",
      }),
    ).toThrow(ZodError);
  });

  it("accepts sync_llm with aiFeatureKey", () => {
    const step = parseAdminSopStepUpsert({
      ...baseManual,
      executionType: "sync_llm",
      aiFeatureKey: "sop.fact_extract",
      promptTemplateId: "00000000-0000-4000-8000-000000000001",
    });
    expect(step.aiFeatureKey).toBe("sop.fact_extract");
  });
});
