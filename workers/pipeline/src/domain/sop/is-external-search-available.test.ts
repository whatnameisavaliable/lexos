import { describe, expect, it, vi } from "vitest";
import { isExternalSearchAvailable } from "./is-external-search-available.js";

describe("isExternalSearchAvailable", () => {
  it("returns false when probe URL is not configured", async () => {
    await expect(
      isExternalSearchAvailable({ probeUrl: "" }),
    ).resolves.toBe(false);
  });

  it("returns false when fetch times out", async () => {
    vi.useFakeTimers();
    const fetchFn = vi.fn(
      () =>
        new Promise<Response>(() => {
          /* never resolves */
        }),
    );

    const promise = isExternalSearchAvailable({
      probeUrl: "https://search.example/health",
      fetchFn,
      timeoutMs: 50,
    });
    await vi.advanceTimersByTimeAsync(60);
    await expect(promise).resolves.toBe(false);
    vi.useRealTimers();
  });

  it("returns true when probe responds ok", async () => {
    const fetchFn = vi.fn(async () => new Response(null, { status: 200 }));

    await expect(
      isExternalSearchAvailable({
        probeUrl: "https://search.example/health",
        fetchFn,
      }),
    ).resolves.toBe(true);
  });
});
