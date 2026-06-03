import { describe, expect, it, vi, afterEach } from "vitest";
import {
  DEFAULT_DEBOUNCE_MS,
  scheduleDebouncedUpdate,
} from "./use-debounced-value.js";

describe("useDebouncedValue", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("DEFAULT_DEBOUNCE_MS is 500", () => {
    expect(DEFAULT_DEBOUNCE_MS).toBe(500);
  });

  it("scheduleDebouncedUpdate fires after delay", () => {
    vi.useFakeTimers();
    const onUpdate = vi.fn();
    scheduleDebouncedUpdate("x", 500, onUpdate);
    expect(onUpdate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(onUpdate).toHaveBeenCalledWith("x");
  });
});
