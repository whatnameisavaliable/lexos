import { describe, expect, it } from "vitest";
import { AiFeatureKey } from "../enums/ai-feature-key.js";
import { applySopLlmTemperature } from "./apply-sop-llm-temperature.js";

describe("applySopLlmTemperature", () => {
  it("sets temperature 0 for sop.fact_extract", () => {
    const body = applySopLlmTemperature({ model: "m" }, AiFeatureKey.SOP_FACT_EXTRACT);
    expect(body.temperature).toBe(0);
  });

  it("does not modify llm_transcript_polish body", () => {
    const body = applySopLlmTemperature(
      { model: "m" },
      AiFeatureKey.LLM_TRANSCRIPT_POLISH,
    );
    expect(body).not.toHaveProperty("temperature");
  });
});
