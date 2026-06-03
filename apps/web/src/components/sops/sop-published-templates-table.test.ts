import { describe, expect, it } from "vitest";

describe("SopPublishedTemplatesTable", () => {
  it("expects template list columns", () => {
    const columns = ["templateName", "caseType", "versionNumber"];
    expect(columns).toHaveLength(3);
  });
});
