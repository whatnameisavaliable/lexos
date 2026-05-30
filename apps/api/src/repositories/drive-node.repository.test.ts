import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { DriveNodeRepository } from "./drive-node.repository.js";

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
    "insert",
    "update",
    "eq",
    "is",
    "order",
    "limit",
    "or",
    "maybeSingle",
    "single",
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

describe("DriveNodeRepository", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockClear();
    mockFrom.mockReset();
  });

  it("findById returns null when RLS hides another user's node", async () => {
    const chain = createQueryChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const repo = new DriveNodeRepository(supabaseEnv);
    const row = await repo.findById(
      "lawyer-b-token",
      "00000000-0000-4000-8000-000000000099",
    );

    expect(row).toBeNull();
    expect(mockFrom).toHaveBeenCalledWith("drive_nodes");
    expect(chain.eq).toHaveBeenCalledWith(
      "id",
      "00000000-0000-4000-8000-000000000099",
    );
  });
});
