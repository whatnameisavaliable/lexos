import { describe, expect, it } from "vitest";

import { hashResetToken } from "@/lib/auth/reset-token";

describe("hashResetToken", () => {
  it("produces stable sha256 hex for ascii tokens", () => {
    const hash = hashResetToken("abc123");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hashResetToken("abc123")).toBe(hash);
  });
});
