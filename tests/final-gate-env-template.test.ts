import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const envExampleSource = readFileSync(".env.example", "utf8");

const finalGateMetadataKeys = [
  "LEXOS_DEPLOY_PROVIDER",
  "LEXOS_DEPLOY_TARGET",
  "LEXOS_DEPLOY_METHOD",
  "LEXOS_DEPLOY_APPROVED_TO_UPLOAD",
  "LEXOS_DEPLOY_APPROVAL_REF",
  "LEXOS_DEPLOY_PRODUCTION_APPROVED",
  "LEXOS_DEPLOY_EXPECTED_URL",
  "LEXOS_FINAL_ACCEPTANCE_OWNER",
  "LEXOS_FINAL_ACCEPTANCE_ENVIRONMENT",
  "LEXOS_FINAL_ACCEPTANCE_RELEASE_VERSION",
  "LEXOS_FINAL_ACCEPTANCE_EVIDENCE_REF",
  "LEXOS_FINAL_ACCEPTANCE_ARCHIVE_DIR",
  "LEXOS_RELEASE_PACKAGE_VERSION",
  "LEXOS_RELEASE_PACKAGE_TARGET_ENV",
  "LEXOS_RELEASE_PACKAGE_MAINTAINER",
  "LEXOS_HANDOVER_OWNER",
  "LEXOS_HANDOVER_CLIENT_SIGNOFF_REF",
  "LEXOS_HANDOVER_RELEASE_APPROVER",
  "LEXOS_HANDOVER_OPERATIONS_OWNER",
  "LEXOS_HANDOVER_SECURITY_REVIEWER",
  "LEXOS_POST_DEPLOYMENT_OWNER",
  "LEXOS_POST_DEPLOYMENT_ENVIRONMENT",
  "LEXOS_POST_DEPLOYMENT_RELEASE_VERSION",
  "LEXOS_POST_DEPLOYMENT_BASE_URL",
  "LEXOS_POST_DEPLOYMENT_ROLLBACK_REF",
  "LEXOS_POST_DEPLOYMENT_OBSERVATION_OWNER",
] as const;

function envValue(key: string): string | undefined {
  const match = envExampleSource.match(new RegExp(`^${key}=(.*)$`, "m"));
  return match?.[1];
}

describe("Final gate env template", () => {
  it("documents every non-secret final gate metadata variable", () => {
    for (const key of finalGateMetadataKeys) {
      assert.match(envExampleSource, new RegExp(`^${key}=`, "m"), `${key} is missing`);
    }
  });

  it("keeps deployment defaults safe until explicit approval", () => {
    assert.equal(envValue("LEXOS_DEPLOY_PROVIDER"), "vercel");
    assert.equal(envValue("LEXOS_DEPLOY_TARGET"), "preview");
    assert.equal(envValue("LEXOS_DEPLOY_APPROVED_TO_UPLOAD"), "false");
    assert.equal(envValue("LEXOS_DEPLOY_PRODUCTION_APPROVED"), "false");
    assert.equal(envValue("LEXOS_FINAL_ACCEPTANCE_ARCHIVE_DIR"), "reports/final-acceptance");
  });
});
