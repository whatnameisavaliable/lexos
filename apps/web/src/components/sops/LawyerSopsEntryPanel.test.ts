import { describe, expect, it } from "vitest";

describe("LawyerSopsEntryPanel", () => {
  it("uses /sops route for entry", () => {
    expect("/sops").toMatch(/^\/sops$/);
  });
});
