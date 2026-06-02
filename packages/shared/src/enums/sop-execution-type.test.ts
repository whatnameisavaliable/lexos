import { describe, expect, it } from "vitest";
import {
  SOP_EXECUTION_TYPE_VALUES,
  SopExecutionType,
  isSopExecutionType,
} from "./sop-execution-type.js";

describe("SopExecutionType", () => {
  it("defines three DB enum values", () => {
    expect(SOP_EXECUTION_TYPE_VALUES).toEqual([
      SopExecutionType.SYNC_LLM,
      SopExecutionType.ASYNC_DEEP_RESEARCH,
      SopExecutionType.MANUAL,
    ]);
  });

  it("isSopExecutionType rejects unknown strings", () => {
    expect(isSopExecutionType("sync_llm")).toBe(true);
    expect(isSopExecutionType("async_deep_research")).toBe(true);
    expect(isSopExecutionType("manual")).toBe(true);
    expect(isSopExecutionType("invalid")).toBe(false);
  });
});
