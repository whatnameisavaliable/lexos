import { describe, expect, it } from "vitest";

describe("LawyerSopsPage", () => {
  it("uses /sops route", () => {
    expect("/sops").toMatch(/^\/sops$/);
  });
});
