import { afterEach, describe, expect, it } from "vitest";
import { ErrorCode } from "./error-code.js";
import {
  MAX_PAGE_LIMIT,
  getDefaultPageLimitFromEnv,
  parseLimit,
} from "./pagination.js";

describe("parseLimit", () => {
  afterEach(() => {
    delete process.env.PAGINATION_DEFAULT_LIMIT;
  });

  it("defaults to MAX_PAGE_LIMIT when unset", () => {
    expect(parseLimit()).toBe(MAX_PAGE_LIMIT);
  });

  it("clamps above max to 50", () => {
    expect(parseLimit({ requested: 200 })).toBe(50);
  });

  it("throws VALIDATION_FAILED for invalid values", () => {
    expect(() => parseLimit({ requested: "abc" })).toThrow(
      ErrorCode.VALIDATION_FAILED,
    );
  });

  it("reads PAGINATION_DEFAULT_LIMIT from env", () => {
    process.env.PAGINATION_DEFAULT_LIMIT = "25";
    expect(getDefaultPageLimitFromEnv()).toBe(25);
  });
});
