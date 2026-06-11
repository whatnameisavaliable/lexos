import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildFinalDeploymentGate,
  formatFinalDeploymentGate,
} from "../src/lib/deployment/final-gate.ts";
import {
  requiredVercelIgnorePatterns,
  type DeploymentChannelInventory,
} from "../src/lib/deployment/deployment-channel.ts";
import type {
  VercelUploadPackageCheck,
} from "../src/lib/deployment/vercel-upload-package.ts";
import { requiredFinalAcceptanceDocs, requiredFinalAcceptanceScripts } from "../src/lib/deployment/final-acceptance.ts";
import { requiredPrivateMigrationFiles, type PrivateReadinessInventory } from "../src/lib/deployment/private-readiness.ts";
import type {
  ReleasePackageInventory,
} from "../src/lib/deployment/release-package.ts";
import {
  RELEASE_SENSITIVE_SCAN_KIND,
  type ReleaseSensitiveScanReport,
} from "../src/lib/deployment/release-sensitive-scan.ts";

const packageScripts = [
  ...requiredFinalAcceptanceScripts,
  "build",
  "start",
  "verify",
  "private:check",
  "launch:check",
  "upgrade:check",
  "deploy:channel:check",
  "final:acceptance",
  "final:acceptance:archive",
  "final:gate:check",
  "handover:evidence:check",
  "postdeploy:check",
  "release:package:check",
  "release:sensitive:check",
  "ops:log:check",
  "error:log:check",
  "perf:check",
  "tenant:check",
  "backup:db",
  "restore:db",
  "backup:storage",
  "restore:storage",
  "backup:schedule",
  "backup:rehearsal",
  "backup:encrypt:check",
  "backup:alert:check",
  "backup:mirror:check",
  "seed:admin",
  "verify:rls",
  "smoke:real",
  "test:e2e",
];

const privateInventory: PrivateReadinessInventory = {
  docs: [
    ...requiredFinalAcceptanceDocs,
    "docs/database.md",
  ],
  migrationFiles: [...requiredPrivateMigrationFiles],
  packageScripts: Array.from(new Set(packageScripts)),
};

const releasePackageInventory: ReleasePackageInventory = {
  ...privateInventory,
  directories: [
    "app",
    "src",
    "scripts",
    "tests",
    "docs",
    "supabase/migrations",
  ],
  rootFiles: [
    "package.json",
    "package-lock.json",
    "next.config.mjs",
    "tsconfig.json",
    "tailwind.config.ts",
    "postcss.config.mjs",
    "eslint.config.mjs",
    "playwright.config.ts",
    "playwright.preview.config.ts",
    ".vercelignore",
    ".env.example",
    "README.md",
  ],
};

const deploymentChannelInventory: DeploymentChannelInventory = {
  gitRemoteUrl: "https://github.com/whatnameisavaliable/lexos.git",
  hasVercelCli: false,
  hasVercelIgnore: true,
  hasVercelJson: false,
  hasVercelProjectConfig: false,
  hasVercelRepoConfig: false,
  vercelIgnorePatterns: [...requiredVercelIgnorePatterns],
};

const vercelUploadPackageCheck: VercelUploadPackageCheck = {
  version: 1,
  app: "lexos",
  kind: "lexos-vercel-upload-package-check",
  generatedAt: "2026-06-10T14:00:00.000Z",
  ok: true,
  includedFileCount: 120,
  includedBytes: 1024,
  includedSamples: ["package.json", "app/page.tsx", "src/index.ts"],
  ignoredPatternCount: requiredVercelIgnorePatterns.length,
  requiredPathSummary: {
    required: 9,
    missing: [],
  },
  highRiskIncludedPaths: [],
  sensitiveFindings: [],
  blockers: [],
  warnings: ["Vercel upload package check is read-only."],
};

function gateEnv(values: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "test",
    LEXOS_AUTH_EMAIL_DOMAIN: "lexos.local",
    LEXOS_DEFAULT_ORGANIZATION_ID: "00000000-0000-0000-0000-000000000001",
    LEXOS_DEPLOY_APPROVAL_REF: "chat-20260610-preview-approval",
    LEXOS_DEPLOY_APPROVED_TO_UPLOAD: "true",
    LEXOS_DEPLOY_METHOD: "vercel-mcp",
    LEXOS_DEPLOY_PROVIDER: "vercel",
    LEXOS_DEPLOY_TARGET: "preview",
    LEXOS_FINAL_ACCEPTANCE_ENVIRONMENT: "律所验收环境",
    LEXOS_FINAL_ACCEPTANCE_EVIDENCE_REF: "acceptance-20260610",
    LEXOS_FINAL_ACCEPTANCE_OWNER: "交付负责人",
    LEXOS_FINAL_ACCEPTANCE_RELEASE_VERSION: "v1.0-rc1",
    LEXOS_HANDOVER_CLIENT_SIGNOFF_REF: "signoff-20260610",
    LEXOS_HANDOVER_OPERATIONS_OWNER: "运维负责人",
    LEXOS_HANDOVER_OWNER: "交付负责人",
    LEXOS_HANDOVER_RELEASE_APPROVER: "发布批准人",
    LEXOS_HANDOVER_SECURITY_REVIEWER: "安全复核人",
    LEXOS_POST_DEPLOYMENT_BASE_URL: "https://lexos.example.com",
    LEXOS_POST_DEPLOYMENT_ENVIRONMENT: "律所验收环境",
    LEXOS_POST_DEPLOYMENT_OBSERVATION_OWNER: "运维负责人",
    LEXOS_POST_DEPLOYMENT_OWNER: "交付负责人",
    LEXOS_POST_DEPLOYMENT_RELEASE_VERSION: "v1.0-rc1",
    LEXOS_POST_DEPLOYMENT_ROLLBACK_REF: "rollback-20260610",
    LEXOS_PREVIEW_BASE_URL: "https://lexos-preview.vercel.app",
    LEXOS_PREVIEW_BUILD_LOG_REF: "build-log-20260610",
    LEXOS_PREVIEW_DEPLOYED_AT: "2026-06-10T13:00:00.000Z",
    LEXOS_PREVIEW_DEPLOYMENT_OWNER: "delivery-owner",
    LEXOS_PREVIEW_DEPLOYMENT_REF: "dpl_preview_20260610",
    LEXOS_PREVIEW_SMOKE_REF: "playwright-preview-smoke-20260610",
    LEXOS_RELEASE_PACKAGE_MAINTAINER: "交付负责人",
    LEXOS_RELEASE_PACKAGE_TARGET_ENV: "律所验收环境",
    LEXOS_RELEASE_PACKAGE_VERSION: "v1.0-rc1",
    NEXT_PUBLIC_DEMO_MODE: "false",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    ...values,
  } as NodeJS.ProcessEnv;
}

function sensitiveScan(values: Partial<ReleaseSensitiveScanReport> = {}): ReleaseSensitiveScanReport {
  return {
    version: 1,
    app: "lexos",
    kind: RELEASE_SENSITIVE_SCAN_KIND,
    generatedAt: "2026-06-10T14:00:00.000Z",
    ok: true,
    scannedFiles: 10,
    skippedFiles: [],
    scannedRoots: ["src", "scripts", "docs"],
    excludedPaths: [".env.local", "node_modules", "reports"],
    blockers: [],
    reviewItems: [],
    warnings: ["敏感扫描为只读检查。"],
    ...values,
  };
}

function buildReadyGate(values: {
  env?: NodeJS.ProcessEnv;
  releaseSensitiveScan?: ReleaseSensitiveScanReport;
} = {}) {
  return buildFinalDeploymentGate({
    env: values.env ?? gateEnv(),
    generatedAt: new Date("2026-06-10T14:00:00.000Z"),
    inventory: privateInventory,
    deploymentChannelInventory,
    vercelUploadPackageCheck,
    releasePackageInventory,
    releaseSensitiveScan: values.releaseSensitiveScan ?? sensitiveScan(),
  });
}

describe("最终部署验收门禁汇总", () => {
  it("所有本地门禁通过时生成通过状态", () => {
    const gate = buildReadyGate();

    assert.equal(gate.ok, true);
    assert.equal(gate.kind, "lexos-final-deployment-gate");
    assert.equal(gate.checks.length, 11);
    assert.deepEqual(gate.blockers, []);
    assert.equal(gate.checks.every((check) => check.ok), true);
  });

  it("缺少部署上传批准时阻断最终门禁", () => {
    const gate = buildReadyGate({
      env: gateEnv({
        LEXOS_DEPLOY_APPROVAL_REF: "",
        LEXOS_DEPLOY_APPROVED_TO_UPLOAD: "",
      }),
    });

    assert.equal(gate.ok, false);
    assert.equal(gate.blockers.some((blocker) => blocker.includes("[Vercel deployment channel]")), true);
    assert.equal(gate.blockers.some((blocker) => blocker.includes("not explicitly approved")), true);
  });

  it("缺少最终验收和交付包元数据时汇总来源前缀", () => {
    const gate = buildReadyGate({
      env: gateEnv({
        LEXOS_FINAL_ACCEPTANCE_ENVIRONMENT: "",
        LEXOS_FINAL_ACCEPTANCE_EVIDENCE_REF: "",
        LEXOS_FINAL_ACCEPTANCE_OWNER: "",
        LEXOS_FINAL_ACCEPTANCE_RELEASE_VERSION: "",
        LEXOS_HANDOVER_CLIENT_SIGNOFF_REF: "",
        LEXOS_HANDOVER_OWNER: "",
        LEXOS_POST_DEPLOYMENT_BASE_URL: "",
        LEXOS_POST_DEPLOYMENT_OWNER: "",
        LEXOS_POST_DEPLOYMENT_ROLLBACK_REF: "",
        LEXOS_RELEASE_PACKAGE_MAINTAINER: "",
        LEXOS_RELEASE_PACKAGE_TARGET_ENV: "",
        LEXOS_RELEASE_PACKAGE_VERSION: "",
      }),
    });

    assert.equal(gate.ok, false);
    assert.equal(gate.blockers.some((blocker) => blocker.includes("[最终部署验收]")), true);
    assert.equal(gate.blockers.some((blocker) => blocker.includes("[最终交付证据索引]")), true);
    assert.equal(gate.blockers.some((blocker) => blocker.includes("[部署后回归核对]")), true);
    assert.equal(gate.blockers.some((blocker) => blocker.includes("[私有化交付包清单]")), true);
  });

  it("敏感扫描出现阻断项时阻断最终门禁", () => {
    const gate = buildReadyGate({
      releaseSensitiveScan: sensitiveScan({
        ok: false,
        blockers: [
          {
            filePath: "src/example.ts",
            line: 12,
            message: "发现疑似真实密钥。",
            ruleId: "secret",
            severity: "blocker",
          },
        ],
      }),
    });

    assert.equal(gate.ok, false);
    assert.equal(gate.blockers.some((blocker) => blocker.includes("src/example.ts:12")), true);
  });

  it("格式化输出包含总览、命令和执行边界", () => {
    const markdown = formatFinalDeploymentGate(buildReadyGate({
      releaseSensitiveScan: sensitiveScan({
        reviewItems: [
          {
            filePath: "docs/final-gate.md",
            line: 20,
            message: "人工复核暂停功能边界。",
            ruleId: "manual-review",
            severity: "review",
          },
        ],
      }),
    }));

    assert.match(markdown, /Lexos 最终部署验收门禁汇总/);
    assert.match(markdown, /npm\.cmd run final:gate:check/);
    assert.match(markdown, /不连接线上 Supabase/);
    assert.match(markdown, /人工复核暂停功能边界/);
  });
});
