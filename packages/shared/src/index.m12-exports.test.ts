import { describe, expect, it } from "vitest";
import {
  adminSopStepUpsertSchema,
  adminSopTemplateCreateBodySchema,
  adminSopVersionPromptsUpsertBodySchema,
  adminSopCreateVersionBodySchema,
  adminSopPreviewPipelineBodySchema,
  parseAdminSopTemplateCreateBody,
} from "./index.js";

describe("M12-A package exports", () => {
  it("re-exports admin SOP DTO schemas from package entry", () => {
    expect(adminSopStepUpsertSchema).toBeDefined();
    expect(adminSopTemplateCreateBodySchema).toBeDefined();
    expect(adminSopVersionPromptsUpsertBodySchema).toBeDefined();
    expect(adminSopCreateVersionBodySchema).toBeDefined();
    expect(adminSopPreviewPipelineBodySchema).toBeDefined();
    expect(
      parseAdminSopTemplateCreateBody({ name: "x", caseType: "y" }).name,
    ).toBe("x");
  });
});
