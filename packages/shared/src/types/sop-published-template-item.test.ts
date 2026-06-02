import { describe, expect, it } from "vitest";
import type { SopPublishedTemplateItem } from "./sop-published-template-item.js";

describe("SopPublishedTemplateItem", () => {
  it("constructs a published template row", () => {
    const row: SopPublishedTemplateItem = {
      templateVersionId: "v-1",
      templateName: "民事一审",
      caseType: "civil",
      versionNumber: 2,
    };
    expect(row.versionNumber).toBe(2);
    expect(row.templateName).toBe("民事一审");
  });
});
