import { describe, expect, it, vi, afterEach } from "vitest";
import { executeSopStep } from "./lawyer-sops-api.js";

describe("executeSopStep", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns sync artifactId on 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            success: true,
            data: { artifactId: "art-1" },
            meta: { requestId: "r1" },
          }),
      }),
    );

    const result = await executeSopStep("p1", "01", { formValues: {} });
    expect(result.kind).toBe("sync");
    if (result.kind === "sync") {
      expect(result.artifactId).toBe("art-1");
    }
  });

  it("returns async accepted on 202 shape", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 202,
        text: async () =>
          JSON.stringify({
            success: true,
            data: {
              pipelineId: "p1",
              stepCode: "02",
              artifactId: "art-2",
            },
            meta: { requestId: "r2" },
          }),
      }),
    );

    const result = await executeSopStep("p1", "02", { formValues: {} });
    expect(result.kind).toBe("async");
    if (result.kind === "async") {
      expect(result.accepted.artifactId).toBe("art-2");
    }
  });
});
