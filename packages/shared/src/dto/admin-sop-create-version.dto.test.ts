import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { parseAdminSopCreateVersionBody } from "./admin-sop-create-version.dto.js";

describe("adminSopCreateVersionBodySchema", () => {
  it("accepts empty body", () => {
    const body = parseAdminSopCreateVersionBody({});
    expect(body.sourceVersionId).toBeUndefined();
  });

  it("rejects invalid sourceVersionId", () => {
    expect(() =>
      parseAdminSopCreateVersionBody({ sourceVersionId: "not-a-uuid" }),
    ).toThrow(ZodError);
  });
});
