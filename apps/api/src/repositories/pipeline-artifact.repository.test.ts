import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { PipelineArtifactRepository } from "./pipeline-artifact.repository.js";
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

describe("PipelineArtifactRepository", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockClear();
    mockFrom.mockReset();
  });

  it("uses lawyer JWT client", async () => {
    mockFrom.mockReturnValue(createSupabaseQueryChain({ data: null, error: null }));

    const repo = new PipelineArtifactRepository(supabaseEnv);
    await repo.findArtifactByStep("token", "pipe-1", "01-A");

    expect(createClient).toHaveBeenCalledWith(
      supabaseEnv.supabaseUrl,
      supabaseEnv.supabaseAnonKey,
      expect.objectContaining({
        auth: { persistSession: false, autoRefreshToken: false },
      }),
    );
    expect(mockFrom).toHaveBeenCalledWith("pipeline_artifacts");
  });
});
