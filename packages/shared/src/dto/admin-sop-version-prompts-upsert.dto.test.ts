import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { parseAdminSopVersionPromptsUpsertBody } from "./admin-sop-version-prompts-upsert.dto.js";

const step = {
  stepCode: "01-A",
  name: "Step A",
  executionType: "manual",
  inputSchema: {},
  dependsOn: [],
  requiresVerification: false,
};

describe("adminSopVersionPromptsUpsertBodySchema", () => {
  it("rejects duplicate stepCode in steps", () => {
    expect(() =>
      parseAdminSopVersionPromptsUpsertBody({
        steps: [step, { ...step }],
      }),
    ).toThrow(ZodError);
  });

  it("accepts unique step codes", () => {
    const body = parseAdminSopVersionPromptsUpsertBody({
      steps: [step, { ...step, stepCode: "02-B" }],
    });
    expect(body.steps).toHaveLength(2);
  });
});
