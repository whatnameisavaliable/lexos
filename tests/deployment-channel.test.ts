import assert from "node:assert/strict";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import {
  buildDeploymentChannelReadiness,
  formatDeploymentChannelReadiness,
  readDeploymentChannelInventory,
  requiredVercelIgnorePatterns,
  type DeploymentChannelInventory,
} from "../src/lib/deployment/deployment-channel.ts";

const inventory: DeploymentChannelInventory = {
  gitRemoteUrl: "https://github.com/whatnameisavaliable/lexos.git",
  hasVercelCli: false,
  hasVercelIgnore: true,
  hasVercelJson: false,
  hasVercelProjectConfig: false,
  hasVercelRepoConfig: false,
  vercelIgnorePatterns: [...requiredVercelIgnorePatterns],
};

function deployEnv(values: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    LEXOS_DEPLOY_APPROVAL_REF: "chat-20260610-preview-approval",
    LEXOS_DEPLOY_APPROVED_TO_UPLOAD: "true",
    LEXOS_DEPLOY_METHOD: "vercel-mcp",
    LEXOS_DEPLOY_PROVIDER: "vercel",
    LEXOS_DEPLOY_TARGET: "preview",
    NODE_ENV: "test",
    ...values,
  } as NodeJS.ProcessEnv;
}

describe("deployment channel readiness", () => {
  it("passes for an explicitly approved Vercel MCP preview deployment", () => {
    const readiness = buildDeploymentChannelReadiness({
      env: deployEnv(),
      generatedAt: new Date("2026-06-10T18:00:00.000Z"),
      inventory,
    });

    assert.equal(readiness.ok, true);
    assert.equal(readiness.kind, "lexos-deployment-channel-readiness");
    assert.equal(readiness.target, "preview");
    assert.equal(readiness.method, "vercel-mcp");
    assert.equal(readiness.blockers.length, 0);
    assert.equal(readiness.warnings.some((warning) => warning.includes("does not upload code")), true);
  });

  it("blocks when upload approval or approval evidence is missing", () => {
    const readiness = buildDeploymentChannelReadiness({
      env: deployEnv({
        LEXOS_DEPLOY_APPROVAL_REF: "",
        LEXOS_DEPLOY_APPROVED_TO_UPLOAD: "",
      }),
      inventory,
    });

    assert.equal(readiness.ok, false);
    assert.equal(readiness.blockers.some((blocker) => blocker.includes("not explicitly approved")), true);
    assert.equal(readiness.blockers.some((blocker) => blocker.includes("approval evidence")), true);
  });

  it("requires explicit production approval for production deployment", () => {
    const readiness = buildDeploymentChannelReadiness({
      env: deployEnv({
        LEXOS_DEPLOY_TARGET: "production",
      }),
      inventory,
    });

    assert.equal(readiness.ok, false);
    assert.equal(readiness.blockers.some((blocker) => blocker.includes("Production deployment requires")), true);
  });

  it("blocks when Vercel upload exclusions are missing", () => {
    const readiness = buildDeploymentChannelReadiness({
      env: deployEnv(),
      inventory: {
        ...inventory,
        hasVercelIgnore: true,
        vercelIgnorePatterns: [".env", ".env*.local"],
      },
    });

    assert.equal(readiness.ok, false);
    assert.equal(readiness.blockers.some((blocker) => blocker.includes(".vercelignore is missing")), true);
    assert.equal(readiness.blockers.some((blocker) => blocker.includes("node_modules/")), true);
    assert.equal(readiness.blockers.some((blocker) => blocker.includes("backups/")), true);
  });

  it("blocks when the Vercel upload ignore list is missing", () => {
    const readiness = buildDeploymentChannelReadiness({
      env: deployEnv(),
      inventory: {
        ...inventory,
        hasVercelIgnore: false,
        vercelIgnorePatterns: [],
      },
    });

    assert.equal(readiness.ok, false);
    assert.equal(readiness.blockers.some((blocker) => blocker.includes("upload ignore list is missing")), true);
  });

  it("blocks CLI method when the Vercel CLI is unavailable", () => {
    const readiness = buildDeploymentChannelReadiness({
      env: deployEnv({
        LEXOS_DEPLOY_METHOD: "vercel-cli",
      }),
      inventory,
    });

    assert.equal(readiness.ok, false);
    assert.equal(readiness.blockers.some((blocker) => blocker.includes("Vercel CLI is not available")), true);
  });

  it("allows an approved Vercel git production deployment without local CLI", () => {
    const readiness = buildDeploymentChannelReadiness({
      env: deployEnv({
        LEXOS_DEPLOY_APPROVAL_REF: "chat-20260611-main-production-approval",
        LEXOS_DEPLOY_METHOD: "vercel-git",
        LEXOS_DEPLOY_PRODUCTION_APPROVED: "true",
        LEXOS_DEPLOY_TARGET: "production",
      }),
      inventory: {
        ...inventory,
        hasVercelCli: false,
        hasVercelProjectConfig: true,
      },
    });

    assert.equal(readiness.ok, true);
    assert.equal(readiness.method, "vercel-git");
    assert.equal(readiness.target, "production");
  });

  it("reads git, Vercel link, and CLI inventory without network access", () => {
    const tempRoot = path.join(tmpdir(), `lexos-deploy-channel-${Date.now()}`);
    const gitDir = path.join(tempRoot, ".git");
    const vercelDir = path.join(tempRoot, ".vercel");
    const binDir = path.join(tempRoot, "bin");

    mkdirSync(gitDir, { recursive: true });
    mkdirSync(vercelDir, { recursive: true });
    mkdirSync(binDir, { recursive: true });
    writeFileSync(path.join(gitDir, "config"), "[remote \"origin\"]\n\turl = https://github.com/whatnameisavaliable/lexos.git\n");
    writeFileSync(path.join(vercelDir, "repo.json"), "{}");
    writeFileSync(path.join(tempRoot, "vercel.json"), "{}");
    writeFileSync(path.join(tempRoot, ".vercelignore"), `${requiredVercelIgnorePatterns.join("\n")}\n`);
    writeFileSync(path.join(binDir, "vercel"), "");
    writeFileSync(path.join(binDir, "vercel.cmd"), "");

    try {
      const found = readDeploymentChannelInventory(tempRoot, {
        NODE_ENV: "test",
        PATH: `${binDir}${path.delimiter}${process.env.PATH || ""}`,
        PATHEXT: ".COM;.EXE;.BAT;.CMD",
      } as NodeJS.ProcessEnv);

      assert.equal(found.gitRemoteUrl, "https://github.com/whatnameisavaliable/lexos.git");
      assert.equal(found.hasVercelCli, true);
      assert.equal(found.hasVercelIgnore, true);
      assert.equal(found.hasVercelJson, true);
      assert.equal(found.hasVercelRepoConfig, true);
      assert.equal(found.hasVercelProjectConfig, false);
      assert.deepEqual(found.vercelIgnorePatterns, [...requiredVercelIgnorePatterns]);
    } finally {
      if (existsSync(tempRoot)) {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    }
  });

  it("formats blockers, command, and execution boundary", () => {
    const markdown = formatDeploymentChannelReadiness(buildDeploymentChannelReadiness({
      env: deployEnv({
        LEXOS_DEPLOY_APPROVED_TO_UPLOAD: "",
      }),
      inventory,
    }));

    assert.match(markdown, /Lexos Deployment Channel Readiness/);
    assert.match(markdown, /npm\.cmd run deploy:channel:check/);
    assert.match(markdown, /Vercel ignore exclusions/);
    assert.match(markdown, /does not upload the project/);
  });
});
