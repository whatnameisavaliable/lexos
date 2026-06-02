import { describe, expect, it } from "vitest";
import {
  ErrorCode,
  SOP_PIPELINE_STAGES,
  SOP_DEEP_RESEARCH_ENABLED_KEY,
} from "./index.js";

describe("M10 shared package exports", () => {
  it("re-exports SOP pipeline stages and CONTEXT_LIMIT_EXCEEDED", () => {
    expect(SOP_PIPELINE_STAGES).toHaveLength(3);
    expect(ErrorCode.CONTEXT_LIMIT_EXCEEDED).toBe("CONTEXT_LIMIT_EXCEEDED");
    expect(SOP_DEEP_RESEARCH_ENABLED_KEY).toBe("sop.deep_research_enabled");
  });
});
