import { describe, expect, it } from "vitest";
import { pickLatestVersionSummary } from "./admin-sops-templates-table.js";

describe("pickLatestVersionSummary", () => {
  it("returns highest version number", () => {
    const latest = pickLatestVersionSummary({
      templateId: "t1",
      name: "模板",
      caseType: "civil",
      createdAt: "2026-01-01T00:00:00.000Z",
      versions: [
        {
          versionId: "v1",
          versionNumber: 1,
          isPublished: true,
          publishedAt: "2026-01-02T00:00:00.000Z",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
        {
          versionId: "v2",
          versionNumber: 2,
          isPublished: false,
          publishedAt: null,
          createdAt: "2026-01-03T00:00:00.000Z",
        },
      ],
    });
    expect(latest?.versionNumber).toBe(2);
  });
});
