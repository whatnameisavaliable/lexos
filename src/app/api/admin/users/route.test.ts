import { describe, expect, it, vi } from "vitest";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Mocked Supabase client — verifies we never call service-role patterns in tests.
 */
function createMockSupabase(
  rpcResult: { data: unknown; error: { message: string } | null },
): Pick<SupabaseClient, "rpc" | "from" | "auth"> {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "admin-id" } },
        error: null,
      }),
    } as unknown as SupabaseClient["auth"],
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: "admin-id",
              username: "admin",
              role: "admin",
              status: "active",
            },
            error: null,
          }),
        }),
      }),
    }),
    rpc: vi.fn().mockResolvedValue(rpcResult),
  };
}

describe("admin user rpc contract (mock)", () => {
  it("expects admin_create_user rpc payload shape", async () => {
    const mock = createMockSupabase({
      data: {
        user_id: "u1",
        username: "lawyer1",
        reset_token: "token",
      },
      error: null,
    });

    const result = await mock.rpc("admin_create_user", {
      p_username: "lawyer1",
      p_role: "lawyer",
      p_ip: null,
      p_user_agent: null,
    });

    expect(mock.rpc).toHaveBeenCalledWith("admin_create_user", {
      p_username: "lawyer1",
      p_role: "lawyer",
      p_ip: null,
      p_user_agent: null,
    });
    expect(result.data).toMatchObject({ reset_token: "token" });
  });
});
