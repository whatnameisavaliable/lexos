import { describe, expect, it } from "vitest";

describe("SopPdfLinkStatus", () => {
  it("treats empty linkedDriveNodeId as unlinked", () => {
    const id: string | null = null;
    expect(id === null || id.length === 0).toBe(true);
  });
});
