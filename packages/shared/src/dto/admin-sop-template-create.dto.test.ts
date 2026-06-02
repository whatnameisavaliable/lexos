import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { parseAdminSopTemplateCreateBody } from "./admin-sop-template-create.dto.js";

describe("adminSopTemplateCreateBodySchema", () => {
  it("rejects empty name", () => {
    expect(() =>
      parseAdminSopTemplateCreateBody({
        name: "   ",
        caseType: "civil",
      }),
    ).toThrow(ZodError);
  });

  it("accepts minimal create payload", () => {
    const body = parseAdminSopTemplateCreateBody({
      name: "离婚纠纷 SOP",
      caseType: "divorce",
    });
    expect(body.name).toBe("离婚纠纷 SOP");
    expect(body.steps).toBeUndefined();
  });
});
