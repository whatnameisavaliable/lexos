import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { parseDriveSearchQuery } from "./drive-search-query.dto.js";

describe("driveSearchQuerySchema", () => {
  it("defaults limit to 50", () => {
    const query = parseDriveSearchQuery({ q: "合同" });
    expect(query.limit).toBe(50);
    expect(query.q).toBe("合同");
  });

  it("rejects q shorter than min length", () => {
    expect(() => parseDriveSearchQuery({ q: "a" })).toThrow(ZodError);
  });

  it("rejects unknown keys", () => {
    expect(() =>
      parseDriveSearchQuery({ q: "合同", offset: 0 } as Record<string, unknown>),
    ).toThrow(ZodError);
  });
});
