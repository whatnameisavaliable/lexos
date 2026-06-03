import { describe, expect, it } from "vitest";
import { SopExecutionType } from "@lexos/shared";
import { executionTypeHint } from "./sop-execution-type-hint.js";

describe("executionTypeHint", () => {
  it("mentions 60s for sync_llm", () => {
    expect(executionTypeHint(SopExecutionType.SYNC_LLM)).toContain("60");
  });

  it("mentions poll for async", () => {
    expect(executionTypeHint(SopExecutionType.ASYNC_DEEP_RESEARCH)).toContain(
      "轮询",
    );
  });
});
