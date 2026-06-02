import { describe, expect, it } from "vitest";
import type { SopAsyncExecuteAccepted } from "./sop-async-execute-accepted.js";

describe("SopAsyncExecuteAccepted", () => {
  it("constructs 202 accepted body", () => {
    const body: SopAsyncExecuteAccepted = {
      pipelineId: "p-1",
      stepCode: "01-B",
      artifactId: "a-1",
    };
    expect(body.stepCode).toBe("01-B");
    expect(body.artifactId).toBe("a-1");
  });
});
