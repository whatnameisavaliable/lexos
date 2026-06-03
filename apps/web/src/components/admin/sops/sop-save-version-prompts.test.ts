import { describe, expect, it } from "vitest";
import { SopExecutionType } from "@lexos/shared";
import type { AdminSopTemplateStepDetail } from "@lexos/shared";
import { buildStepsUpsertBody } from "./sop-version-editor-utils.js";

describe("buildStepsUpsertBody", () => {
  it("maps local steps to upsert body", () => {
    const steps: AdminSopTemplateStepDetail[] = [
      {
        id: "s1",
        stepCode: "fact",
        name: "事实",
        executionType: SopExecutionType.MANUAL,
        aiFeatureKey: null,
        promptTemplateId: null,
        inputSchema: { type: "object" },
        dependsOn: [],
        requiresVerification: false,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ];

    const body = buildStepsUpsertBody(steps);
    expect(body.steps).toHaveLength(1);
    expect(body.steps[0]?.stepCode).toBe("fact");
  });
});
