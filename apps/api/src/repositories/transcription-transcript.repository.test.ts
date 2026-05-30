import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { TranscriptionTranscriptRepository } from "./transcription-transcript.repository.js";

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

function createQueryChain(finalResult: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = [
    "select",
    "update",
    "eq",
    "maybeSingle",
  ] as const;

  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  Object.defineProperty(chain, "then", {
    value: (onFulfilled: (v: unknown) => unknown) =>
      Promise.resolve(finalResult).then(onFulfilled),
  });

  return chain;
}

describe("TranscriptionTranscriptRepository", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockClear();
    mockFrom.mockReset();
  });

  it("updatePolishedText returns updated false when version conflict (0 rows)", async () => {
    const chain = createQueryChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const repo = new TranscriptionTranscriptRepository(supabaseEnv);
    const result = await repo.updatePolishedText(
      "token",
      "task-1",
      "new text",
      2,
      "user-1",
    );

    expect(result.updated).toBe(false);
    expect(result.record).toBeNull();
    expect(chain.eq).toHaveBeenCalledWith("task_id", "task-1");
    expect(chain.eq).toHaveBeenCalledWith("version", 2);
  });

  it("updatePolishedText returns updated record on success", async () => {
    const chain = createQueryChain({
      data: {
        task_id: "task-1",
        asr_raw_json: null,
        polished_text: "new text",
        summary_text: "summary",
        version: 3,
        updated_at: "2026-01-01T00:00:00.000Z",
      },
      error: null,
    });
    mockFrom.mockReturnValue(chain);

    const repo = new TranscriptionTranscriptRepository(supabaseEnv);
    const result = await repo.updatePolishedText(
      "token",
      "task-1",
      "new text",
      2,
      "user-1",
    );

    expect(result.updated).toBe(true);
    expect(result.record?.version).toBe(3);
    expect(result.record?.polishedText).toBe("new text");
  });
});
