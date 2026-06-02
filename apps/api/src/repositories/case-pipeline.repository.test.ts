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

describe("CasePipelineRepository", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockClear();
    mockFrom.mockReset();
  });

  it("constructs user JWT client with Authorization header", async () => {
    mockFrom.mockReturnValue(createSupabaseQueryChain({ data: null, error: null }));

    const repo = new CasePipelineRepository(supabaseEnv);
    await repo.findPipelineForLawyer("lawyer-jwt", "pipe-1");

    expect(createClient).toHaveBeenCalledWith(
      supabaseEnv.supabaseUrl,
      supabaseEnv.supabaseAnonKey,
      expect.objectContaining({
        global: { headers: { Authorization: "Bearer lawyer-jwt" } },
      }),
    );
    expect(mockFrom).toHaveBeenCalledWith("case_pipelines");
  });
});
