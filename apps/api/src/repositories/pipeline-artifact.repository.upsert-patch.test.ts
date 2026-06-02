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

const artifactRow = {
  id: "art-1",
  pipeline_id: "pipe-1",
  step_code: "01-A",
  content_type: "markdown",
  content_raw: "body",
  version: 2,
  status: "draft",
  linked_drive_node_id: null,
  finalized_snapshot_raw: null,
  updated_by: "lawyer-1",
  updated_at: "2026-06-01T00:00:00.000Z",
};

describe("PipelineArtifactRepository upsert and patch", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockClear();
    mockFrom.mockReset();
  });

  it("upsertArtifactForStep uses pipeline_id,step_code conflict target", async () => {
    const chain = createSupabaseQueryChain({ data: artifactRow, error: null });
    mockFrom.mockReturnValue(chain);

    const repo = new PipelineArtifactRepository(supabaseEnv);
    const row = await repo.upsertArtifactForStep("token", {
      pipelineId: "pipe-1",
      stepCode: "01-A",
      contentType: "markdown",
      status: "draft",
    });

    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        pipeline_id: "pipe-1",
        step_code: "01-A",
      }),
      { onConflict: "pipeline_id,step_code" },
    );
    expect(row.version).toBe(2);
  });

  it("findArtifactByStep queries by pipeline and step", async () => {
    const chain = createSupabaseQueryChain({ data: artifactRow, error: null });
    mockFrom.mockReturnValue(chain);

    const repo = new PipelineArtifactRepository(supabaseEnv);
    const row = await repo.findArtifactByStep("token", "pipe-1", "01-A");

    expect(chain.eq).toHaveBeenCalledWith("pipeline_id", "pipe-1");
    expect(chain.eq).toHaveBeenCalledWith("step_code", "01-A");
    expect(row?.id).toBe("art-1");
  });

  it("patchContentRaw returns null on version conflict (0 rows)", async () => {
    const chain = createSupabaseQueryChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const repo = new PipelineArtifactRepository(supabaseEnv);
    const row = await repo.patchContentRaw("token", "art-1", 1, "new body");

    expect(row).toBeNull();
    expect(chain.eq).toHaveBeenCalledWith("version", 1);
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ version: 2, content_raw: "new body" }),
    );
  });
});
