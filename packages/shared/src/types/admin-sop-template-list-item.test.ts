import { describe, expect, it } from "vitest";
import type { AdminSopTemplateListItem } from "./admin-sop-template-list-item.js";

describe("AdminSopTemplateListItem", () => {
  it("constructs a list row", () => {
    const row: AdminSopTemplateListItem = {
      templateId: "t-1",
      name: "Template",
      caseType: "civil",
      createdAt: "2026-06-02T00:00:00.000Z",
      versions: [
        {
          versionId: "v-1",
          versionNumber: 1,
          isPublished: true,
          publishedAt: "2026-06-02T01:00:00.000Z",
          createdAt: "2026-06-02T00:00:00.000Z",
        },
      ],
    };
    expect(row.versions[0]?.isPublished).toBe(true);
  });
});
