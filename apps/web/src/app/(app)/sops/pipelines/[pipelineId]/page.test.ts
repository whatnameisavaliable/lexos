import { describe, expect, it } from "vitest";
import { lawyerSopPipelinePath } from "@/lib/sop-pipeline-poll-utils";

describe("LawyerSopPipelinePage", () => {
  it("uses pipeline workspace path prefix", () => {
    expect(lawyerSopPipelinePath("abc")).toMatch(/^\/sops\/pipelines\//);
  });
});
