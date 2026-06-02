import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { CasePipelineRepository } from "./case-pipeline.repository.js";
import { createSupabaseQueryChain } from "./supabase-query-chain.mock.js";

const supabaseEnv = {
  supabaseUrl: "https://example.supabase.co",
  supabaseAnonKey: "anon-key",
  supabaseServiceRoleKey: "service-role-key",
  supabaseJwtSecret: "jwt-secret",
  supabaseDbUrl: "postgres://localhost/db",
};

const mockFrom = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

describe("CasePipelineRepository.find and update", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockClear();
    mockFrom.mockReset();
  });

  it("findPipelineForLawyer returns null when RLS hides row", async () => {
    const chain = createSupabaseQueryChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const repo = new CasePipelineRepository(supabaseEnv);
    const row = await repo.findPipelineForLawyer("token", "pipe-other");

    expect(row).toBeNull();
    expect(chain.eq).toHaveBeenCalledWith("id", "pipe-other");
  });

  it("updatePipelineStatus maps updated row", async () => {
    const chain = createSupabaseQueryChain({
      data: {
        id: "pipe-1",
        lawyer_id: "lawyer-1",
        template_version_id: "ver-1",
        status: "suspended",
        current_step_code: "01-A",
        created_at: "2026-06-01T00:00:00.000Z",
      },
      error: null,
    });
    mockFrom.mockReturnValue(chain);

    const repo = new CasePipelineRepository(supabaseEnv);
    const row = await repo.updatePipelineStatus("token", "pipe-1", "suspended");

    expect(chain.update).toHaveBeenCalledWith({ status: "suspended" });
    expect(row?.status).toBe("suspended");
  });
});
