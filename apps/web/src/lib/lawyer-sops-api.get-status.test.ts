import { describe, expect, it, vi, afterEach } from "vitest";
import { SopExecutionType } from "@lexos/shared";
import { getSopPipelineStatus } from "./lawyer-sops-api.js";

describe("getSopPipelineStatus", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("GETs pipeline status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            success: true,
            data: {
              pipelineId: "p1",
              status: "in_progress",
              currentStepCode: "01",
              deepResearchEnabled: true,
              steps: [
                {
                  stepCode: "01",
                  name: "步骤",
                  executionType: SopExecutionType.MANUAL,
                  inputSchema: {},
                  requiresVerification: false,
                  artifactStatus: null,
                  artifactId: null,
                },
              ],
            },
            meta: { requestId: "r1" },
          }),
      }),
    );

    const status = await getSopPipelineStatus("p1");
    expect(status.pipelineId).toBe("p1");
    expect(status.deepResearchEnabled).toBe(true);
  });
});
