import { describe, expect, it } from "vitest";
import type { AdminSopTemplateVersionDetail } from "./admin-sop-template-version-detail.js";
import { SopExecutionType } from "../enums/sop-execution-type.js";

describe("AdminSopTemplateVersionDetail", () => {
  it("constructs version detail with steps", () => {
    const detail: AdminSopTemplateVersionDetail = {
      versionId: "v-1",
      templateId: "t-1",
      templateName: "SOP",
      caseType: "civil",
      versionNumber: 0,
      isPublished: false,
      publishedAt: null,
      createdAt: "2026-06-02T00:00:00.000Z",
      steps: [
        {
          id: "s-1",
          stepCode: "01-A",
          name: "Facts",
          executionType: SopExecutionType.MANUAL,
          aiFeatureKey: null,
          promptTemplateId: null,
          inputSchema: {},
          dependsOn: [],
          requiresVerification: false,
          createdAt: "2026-06-02T00:00:00.000Z",
        },
      ],
    };
    expect(detail.steps[0]?.executionType).toBe("manual");
  });
});
