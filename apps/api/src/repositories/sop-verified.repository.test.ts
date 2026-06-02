import { describe, expect, it, vi } from "vitest";
import { SopVerifiedRepository } from "./sop-verified.repository.js";

function createMaybeSingleChain(data: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({ data, error: null })),
  };
}

describe("SopVerifiedRepository", () => {
  it("hasAutoVerification queries success logs by metadata", async () => {
    const chain = createMaybeSingleChain({ id: "log-1" });
    const from = vi.fn().mockReturnValue(chain);
    const repo = new SopVerifiedRepository({ from } as never);

    const ok = await repo.hasAutoVerification("pipe-1", "01-A");

    expect(ok).toBe(true);
    expect(from).toHaveBeenCalledWith("ai_invocation_logs");
    expect(chain.eq).toHaveBeenCalledWith("outcome", "success");
    expect(chain.contains).toHaveBeenCalledWith("metadata", {
      pipeline_id: "pipe-1",
      step_code: "01-A",
    });
  });

  it("hasManualVerification queries sop.artifact.verify audit", async () => {
    const chain = createMaybeSingleChain(null);
    const from = vi.fn().mockReturnValue(chain);
    const repo = new SopVerifiedRepository({ from } as never);

    const ok = await repo.hasManualVerification("art-1");

    expect(ok).toBe(false);
    expect(from).toHaveBeenCalledWith("audit_logs");
    expect(chain.eq).toHaveBeenCalledWith("action", "sop.artifact.verify");
    expect(chain.contains).toHaveBeenCalledWith("metadata", {
      artifact_id: "art-1",
    });
  });
});
