import { describe, expect, it } from "vitest";
import { pickLatestVersionSummary } from "./admin-sops-templates-table.js";

describe("AdminSopsPagePanel", () => {
  it("uses latest version summary for table rows", () => {
    const latest = pickLatestVersionSummary({
      templateId: "t1",
      name: "模板",
      caseType: "civil",
      createdAt: "2026-01-01T00:00:00.000Z",
      versions: [
        {
          versionId: "v2",
          versionNumber: 2,
          isPublished: false,
          publishedAt: null,
          createdAt: "2026-01-02T00:00:00.000Z",
        },
      ],
    });
    expect(latest?.versionNumber).toBe(2);
  });
});
