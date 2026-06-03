import { describe, expect, it } from "vitest";
import { formatPublishError } from "./sop-admin-ui-utils.js";

describe("formatPublishError", () => {
  it("prefixes validation errors", () => {
    expect(formatPublishError("missing mapping", "VALIDATION_FAILED")).toContain(
      "发布校验未通过",
    );
  });

  it("returns raw message for other errors", () => {
    expect(formatPublishError("network")).toBe("network");
  });
});
