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
  content_type: "html",
  content_raw: "<p>x</p>",
  version: 1,
  status: "finalized",
  linked_drive_node_id: null,
  finalized_snapshot_raw: "<p>x</p>",
  updated_by: "lawyer-1",
  updated_at: "2026-06-01T00:00:00.000Z",
};

describe("PipelineArtifactRepository status mutations", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockClear();
    mockFrom.mockReset();
  });

  it("setArtifactStatus updates status only", async () => {
    const chain = createSupabaseQueryChain({
      data: { ...artifactRow, status: "running" },
      error: null,
    });
    mockFrom.mockReturnValue(chain);

    const repo = new PipelineArtifactRepository(supabaseEnv);
    const row = await repo.setArtifactStatus("token", "art-1", "running");

    expect(chain.update).toHaveBeenCalledWith({ status: "running" });
    expect(row?.status).toBe("running");
  });

  it("setFinalizedSnapshot writes snapshot and finalized status", async () => {
    const chain = createSupabaseQueryChain({ data: artifactRow, error: null });
    mockFrom.mockReturnValue(chain);

    const repo = new PipelineArtifactRepository(supabaseEnv);
    const row = await repo.setFinalizedSnapshot("token", "art-1", "<p>x</p>");

    expect(chain.update).toHaveBeenCalledWith({
      finalized_snapshot_raw: "<p>x</p>",
      status: "finalized",
    });
    expect(row?.finalizedSnapshotRaw).toBe("<p>x</p>");
  });
});
