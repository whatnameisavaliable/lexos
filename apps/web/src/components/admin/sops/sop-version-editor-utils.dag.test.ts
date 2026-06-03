import { describe, expect, it } from "vitest";
import {
  localizeSopDagSaveError,
  validateSopStepsDagForSave,
} from "./sop-version-editor-utils.js";

describe("validateSopStepsDagForSave", () => {
  it("rejects two entry steps", () => {
    const err = validateSopStepsDagForSave([
      { stepCode: "step_1", dependsOn: [] },
      { stepCode: "step_2", dependsOn: [] },
    ]);
    expect(err).toContain("只能有一个入口");
    expect(err).toContain("step_1");
  });

  it("accepts linear chain", () => {
    expect(
      validateSopStepsDagForSave([
        { stepCode: "step_1", dependsOn: [] },
        { stepCode: "step_2", dependsOn: ["step_1"] },
      ]),
    ).toBeNull();
  });
});

describe("localizeSopDagSaveError", () => {
  it("localizes DAG entry API message", () => {
    expect(
      localizeSopDagSaveError(
        "SOP template must have exactly one DAG entry; found 2",
      ),
    ).toContain("只能有一个入口");
  });
});
