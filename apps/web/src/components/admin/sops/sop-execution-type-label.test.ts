import { describe, expect, it } from "vitest";
import { SopExecutionType } from "@lexos/shared";
import { executionTypeLabel } from "./sop-execution-type-label.js";

describe("executionTypeLabel", () => {
  it("maps sync_llm", () => {
    expect(executionTypeLabel(SopExecutionType.SYNC_LLM)).toBe("同步 LLM");
  });

  it("maps async_deep_research", () => {
    expect(executionTypeLabel(SopExecutionType.ASYNC_DEEP_RESEARCH)).toBe(
      "异步深度研究",
    );
  });

  it("maps manual", () => {
    expect(executionTypeLabel(SopExecutionType.MANUAL)).toBe("人工表单");
  });
});
