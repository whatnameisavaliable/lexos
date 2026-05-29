import { describe, expect, it, vi } from "vitest";
import { fetchTranscriptionTaskAsUser } from "./transcription-tasks-rls.js";

describe("fetchTranscriptionTaskAsUser", () => {
  it("returns null when RLS hides the row", async () => {
    const client = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    };

    const row = await fetchTranscriptionTaskAsUser(
      client as never,
      "00000000-0000-4000-8000-000000000099",
    );
    expect(row).toBeNull();
  });
});
