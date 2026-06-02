import { describe, expect, it } from "vitest";
import { extractMustacheSlotNames } from "./extract-mustache-slot-names.js";

describe("extractMustacheSlotNames", () => {
  it("parses standard and spaced mustache slots", () => {
    const slots = extractMustacheSlotNames(
      "Facts: {{artifact_01_A_fact}} and {{ sop_media_extracted_text }}",
    );
    expect(slots).toContain("artifact_01_A_fact");
    expect(slots).toContain("sop_media_extracted_text");
  });
});
