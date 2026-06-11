import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildVercelPreviewDeploymentEvidence,
  formatVercelPreviewDeploymentEvidence,
} from "../src/lib/deployment/preview-deployment-evidence.ts";

function evidenceEnv(values: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "test",
    LEXOS_DEPLOY_APPROVAL_REF: "chat-20260610-preview-approval",
    LEXOS_DEPLOY_APPROVED_TO_UPLOAD: "true",
    LEXOS_PREVIEW_BASE_URL: "https://lexos-preview.vercel.app",
    LEXOS_PREVIEW_BUILD_LOG_REF: "build-log-20260610",
    LEXOS_PREVIEW_DEPLOYED_AT: "2026-06-10T13:00:00.000Z",
    LEXOS_PREVIEW_DEPLOYMENT_OWNER: "delivery-owner",
    LEXOS_PREVIEW_DEPLOYMENT_REF: "dpl_preview_20260610",
    LEXOS_PREVIEW_SMOKE_REF: "reports/preview-smoke/results.json",
    ...values,
  } as NodeJS.ProcessEnv;
}

describe("Vercel Preview deployment evidence", () => {
  it("passes when approval, URL, deployment, build log, smoke, owner, and timestamp evidence are present", () => {
    const report = buildVercelPreviewDeploymentEvidence({
      env: evidenceEnv(),
      generatedAt: new Date("2026-06-10T14:00:00.000Z"),
    });

    assert.equal(report.ok, true);
    assert.equal(report.kind, "lexos-vercel-preview-deployment-evidence");
    assert.equal(report.evidenceItems.every((item) => item.ok), true);
    assert.deepEqual(report.blockers, []);
  });

  it("blocks when deployment evidence is missing", () => {
    const report = buildVercelPreviewDeploymentEvidence({
      env: evidenceEnv({
        LEXOS_DEPLOY_APPROVAL_REF: "",
        LEXOS_DEPLOY_APPROVED_TO_UPLOAD: "",
        LEXOS_PREVIEW_BASE_URL: "",
        LEXOS_PREVIEW_BUILD_LOG_REF: "",
        LEXOS_PREVIEW_DEPLOYED_AT: "",
        LEXOS_PREVIEW_DEPLOYMENT_OWNER: "",
        LEXOS_PREVIEW_DEPLOYMENT_REF: "",
        LEXOS_PREVIEW_SMOKE_REF: "",
      }),
      generatedAt: new Date("2026-06-10T14:00:00.000Z"),
    });

    assert.equal(report.ok, false);
    assert.equal(report.blockers.some((blocker) => blocker.includes("APPROVED_TO_UPLOAD")), true);
    assert.equal(report.blockers.some((blocker) => blocker.includes("PREVIEW_BASE_URL")), true);
    assert.equal(report.blockers.some((blocker) => blocker.includes("PREVIEW_SMOKE_REF")), true);
  });

  it("requires a public https Preview URL", () => {
    const localReport = buildVercelPreviewDeploymentEvidence({
      env: evidenceEnv({ LEXOS_PREVIEW_BASE_URL: "http://127.0.0.1:3000" }),
      generatedAt: new Date("2026-06-10T14:00:00.000Z"),
    });
    const badUrlReport = buildVercelPreviewDeploymentEvidence({
      env: evidenceEnv({ LEXOS_PREVIEW_BASE_URL: "not-a-url" }),
      generatedAt: new Date("2026-06-10T14:00:00.000Z"),
    });

    assert.equal(localReport.ok, false);
    assert.equal(localReport.blockers.some((blocker) => blocker.includes("public Preview URL")), true);
    assert.equal(badUrlReport.ok, false);
    assert.equal(badUrlReport.blockers.some((blocker) => blocker.includes("valid URL")), true);
  });

  it("rejects future timestamps and credential-like evidence references", () => {
    const report = buildVercelPreviewDeploymentEvidence({
      env: evidenceEnv({
        LEXOS_PREVIEW_DEPLOYED_AT: "2026-06-10T15:30:00.000Z",
        LEXOS_PREVIEW_SMOKE_REF: "secret-smoke-ref",
      }),
      generatedAt: new Date("2026-06-10T14:00:00.000Z"),
    });

    assert.equal(report.ok, false);
    assert.equal(report.blockers.some((blocker) => blocker.includes("future")), true);
    assert.equal(report.blockers.some((blocker) => blocker.includes("PREVIEW_SMOKE_REF")), true);
  });

  it("formats command and execution boundary", () => {
    const markdown = formatVercelPreviewDeploymentEvidence(buildVercelPreviewDeploymentEvidence({
      env: evidenceEnv(),
      generatedAt: new Date("2026-06-10T14:00:00.000Z"),
    }));

    assert.match(markdown, /Lexos Vercel Preview Deployment Evidence/);
    assert.match(markdown, /npm\.cmd run deploy:preview:evidence/);
    assert.match(markdown, /does not deploy/);
  });
});
