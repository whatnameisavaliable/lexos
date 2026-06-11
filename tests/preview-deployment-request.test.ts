import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import {
  buildVercelPreviewDeploymentRequest,
  formatVercelPreviewDeploymentRequest,
} from "../src/lib/deployment/preview-deployment-request.ts";

const completeVercelIgnore = [
  ".env",
  ".env*.local",
  ".git/",
  ".next/",
  ".tmp/",
  "backups/",
  "coverage/",
  "dev-server*.log",
  "dist/",
  "node_modules/",
  "playwright-report/",
  "reports/",
  "supabase/.temp/",
  "test-results/",
  "tests/",
  "tsconfig.tsbuildinfo",
  "*.log",
].join("\n");

function makeTempWorkspace(): string {
  return path.join(os.tmpdir(), `lexos-preview-request-${Date.now()}-${Math.random().toString(16).slice(2)}`);
}

function writeWorkspaceFile(cwd: string, filePath: string, content: string): void {
  const absolutePath = path.join(cwd, ...filePath.split("/"));
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, "utf8");
}

function writeMinimalProject(cwd: string, vercelIgnore = `${completeVercelIgnore}\n`): void {
  writeWorkspaceFile(cwd, ".vercelignore", vercelIgnore);
  writeWorkspaceFile(cwd, "app/page.tsx", "export default function Page() { return null; }\n");
  writeWorkspaceFile(cwd, "src/index.ts", "export const ok = true;\n");
  writeWorkspaceFile(cwd, "package.json", "{\"scripts\":{\"build\":\"next build\"}}\n");
  writeWorkspaceFile(cwd, "package-lock.json", "{}\n");
  writeWorkspaceFile(cwd, "next.config.mjs", "const nextConfig = {}; export default nextConfig;\n");
  writeWorkspaceFile(cwd, "postcss.config.mjs", "export default {};\n");
  writeWorkspaceFile(cwd, "tailwind.config.ts", "export default {};\n");
  writeWorkspaceFile(cwd, "tsconfig.json", "{}\n");
}

describe("Vercel Preview deployment request", () => {
  it("passes as ready for approval when upload approval is still pending", () => {
    const cwd = makeTempWorkspace();

    writeMinimalProject(cwd);

    try {
      const request = buildVercelPreviewDeploymentRequest({
        cwd,
        env: {
          NODE_ENV: "test",
          LEXOS_DEPLOY_METHOD: "vercel-mcp",
          NEXT_PUBLIC_DEMO_MODE: "true",
        } as NodeJS.ProcessEnv,
        generatedAt: new Date("2026-06-10T15:00:00.000Z"),
      });

      assert.equal(request.ok, true);
      assert.equal(request.approvalStatus, "pending");
      assert.equal(request.previewReadiness.mode, "demo");
      assert.equal(request.uploadPackage.ok, true);
      assert.equal(request.blockers.length, 0);
      assert.equal(request.nextActions.some((action) => action.includes("Ask the user to approve")), true);
    } finally {
      rmSync(cwd, { force: true, recursive: true });
    }
  });

  it("blocks when Preview Supabase mode is missing required variables", () => {
    const cwd = makeTempWorkspace();

    writeMinimalProject(cwd);

    try {
      const request = buildVercelPreviewDeploymentRequest({
        cwd,
        env: {
          NODE_ENV: "test",
          LEXOS_DEPLOY_METHOD: "vercel-mcp",
          NEXT_PUBLIC_DEMO_MODE: "false",
          NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        } as NodeJS.ProcessEnv,
      });

      assert.equal(request.ok, false);
      assert.equal(request.blockers.some((blocker) => blocker.includes("Preview readiness is blocked")), true);
      assert.equal(request.previewReadiness.missingSupabaseEnvKeys.includes("SUPABASE_SERVICE_ROLE_KEY"), true);
    } finally {
      rmSync(cwd, { force: true, recursive: true });
    }
  });

  it("blocks when the upload package is not clean", () => {
    const cwd = makeTempWorkspace();

    writeMinimalProject(cwd, ".env\n");
    writeWorkspaceFile(cwd, "backups/db.sql", "local backup\n");

    try {
      const request = buildVercelPreviewDeploymentRequest({
        cwd,
        env: {
          NODE_ENV: "test",
          LEXOS_DEPLOY_METHOD: "vercel-mcp",
          NEXT_PUBLIC_DEMO_MODE: "true",
        } as NodeJS.ProcessEnv,
      });

      assert.equal(request.ok, false);
      assert.equal(request.blockers.some((blocker) => blocker.includes("Upload package:")), true);
    } finally {
      rmSync(cwd, { force: true, recursive: true });
    }
  });

  it("blocks production target because this packet is Preview-only", () => {
    const cwd = makeTempWorkspace();

    writeMinimalProject(cwd);

    try {
      const request = buildVercelPreviewDeploymentRequest({
        cwd,
        env: {
          NODE_ENV: "test",
          LEXOS_DEPLOY_METHOD: "vercel-mcp",
          LEXOS_DEPLOY_TARGET: "production",
          NEXT_PUBLIC_DEMO_MODE: "true",
        } as NodeJS.ProcessEnv,
      });

      assert.equal(request.ok, false);
      assert.equal(request.blockers.some((blocker) => blocker.includes("only prepares Vercel Preview")), true);
    } finally {
      rmSync(cwd, { force: true, recursive: true });
    }
  });

  it("formats command, approval statement, and execution boundary", () => {
    const cwd = makeTempWorkspace();

    writeMinimalProject(cwd);

    try {
      const markdown = formatVercelPreviewDeploymentRequest(buildVercelPreviewDeploymentRequest({
        cwd,
        env: {
          NODE_ENV: "test",
          LEXOS_DEPLOY_METHOD: "vercel-mcp",
          NEXT_PUBLIC_DEMO_MODE: "true",
        } as NodeJS.ProcessEnv,
      }));

      assert.match(markdown, /Lexos Vercel Preview Deployment Request/);
      assert.match(markdown, /npm\.cmd run deploy:preview:request/);
      assert.match(markdown, /I approve uploading/);
      assert.match(markdown, /does not upload the project/);
    } finally {
      rmSync(cwd, { force: true, recursive: true });
    }
  });
});
