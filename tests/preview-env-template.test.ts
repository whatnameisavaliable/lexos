import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const envExampleSource = readFileSync(".env.example", "utf8");

const previewEvidenceKeys = [
  "LEXOS_PREVIEW_SMOKE_REPORT_PATH",
  "LEXOS_PREVIEW_DEPLOYMENT_REF",
  "LEXOS_PREVIEW_DEPLOYMENT_ID",
  "LEXOS_PREVIEW_BUILD_LOG_REF",
  "LEXOS_PREVIEW_SMOKE_REF",
  "LEXOS_PREVIEW_DEPLOYMENT_OWNER",
  "LEXOS_PREVIEW_DEPLOYED_AT",
  "LEXOS_PREVIEW_CLAIM_URL",
] as const;

function envValue(key: string): string | undefined {
  const match = envExampleSource.match(new RegExp(`^${key}=(.*)$`, "m"));
  return match?.[1];
}

describe("Preview deployment env template", () => {
  it("documents every Preview deployment evidence variable", () => {
    for (const key of previewEvidenceKeys) {
      assert.match(envExampleSource, new RegExp(`^${key}=`, "m"), `${key} is missing`);
    }
  });

  it("keeps deploy upload approval off and uses the stable smoke report path by default", () => {
    assert.equal(envValue("LEXOS_DEPLOY_APPROVED_TO_UPLOAD"), "false");
    assert.equal(envValue("LEXOS_PREVIEW_SMOKE_REPORT_PATH"), "reports/preview-smoke/results.json");
    assert.equal(envValue("LEXOS_PREVIEW_SMOKE_REF"), "reports/preview-smoke/results.json");
  });
});
