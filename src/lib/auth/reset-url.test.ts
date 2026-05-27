import { afterEach, describe, expect, it, vi } from "vitest";

import { buildResetPasswordUrl } from "@/lib/auth/reset-url";

describe("buildResetPasswordUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds encoded reset url from app base", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    const url = buildResetPasswordUrl("abc+token");
    expect(url).toBe(
      "http://localhost:3000/reset-password?token=abc%2Btoken",
    );
  });
});
