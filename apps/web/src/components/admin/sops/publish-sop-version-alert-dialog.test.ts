import { describe, expect, it } from "vitest";
import { formatPublishError } from "./sop-admin-ui-utils.js";

describe("PublishSopVersionAlertDialog", () => {
  it("formats publish validation errors", () => {
    expect(formatPublishError("DAG invalid", "VALIDATION_FAILED")).toContain(
      "发布校验未通过",
    );
  });
});
