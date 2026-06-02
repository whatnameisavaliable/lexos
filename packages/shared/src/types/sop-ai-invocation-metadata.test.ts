import { describe, expect, it } from "vitest";
import { toSopAiInvocationMetadata } from "./sop-ai-invocation-metadata.js";

describe("SopAiInvocationMetadata", () => {
  it("round-trips through JSON", () => {
    const meta = toSopAiInvocationMetadata(
      "00000000-0000-4000-8000-000000000001",
      "01-A",
    );
    const parsed = JSON.parse(JSON.stringify(meta));
    expect(parsed.pipeline_id).toBe(meta.pipeline_id);
    expect(parsed.step_code).toBe("01-A");
  });
});
