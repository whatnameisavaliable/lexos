import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import {
  buildVercelUploadPackageCheck,
  formatVercelUploadPackageCheck,
} from "../src/lib/deployment/vercel-upload-package.ts";

const fakeDatabaseUrl = ["postgres://lexos", "password@example.com/postgres"].join(":");

function makeTempWorkspace(): string {
  return path.join(os.tmpdir(), `lexos-vercel-upload-${Date.now()}-${Math.random().toString(16).slice(2)}`);
}

function writeWorkspaceFile(cwd: string, filePath: string, content: string): void {
  const absolutePath = path.join(cwd, ...filePath.split("/"));
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, "utf8");
}

function writeMinimalProject(cwd: string, vercelIgnore: string): void {
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

describe("Vercel upload package check", () => {
  it("passes when high-risk local paths are ignored", () => {
    const cwd = makeTempWorkspace();

    writeMinimalProject(cwd, `${completeVercelIgnore}\n`);
    writeWorkspaceFile(cwd, ".env.local", "SUPABASE_SERVICE_ROLE_KEY=not-read\n");
    writeWorkspaceFile(cwd, "backups/db.sql", `${fakeDatabaseUrl}\n`);
    writeWorkspaceFile(cwd, ".next/cache/file.txt", "cache\n");
    writeWorkspaceFile(cwd, "node_modules/pkg/index.js", "module.exports = true;\n");

    try {
      const check = buildVercelUploadPackageCheck({
        cwd,
        generatedAt: new Date("2026-06-10T12:00:00.000Z"),
      });

      assert.equal(check.ok, true);
      assert.equal(check.highRiskIncludedPaths.length, 0);
      assert.equal(check.sensitiveFindings.length, 0);
      assert.equal(check.requiredPathSummary.missing.length, 0);
      assert.equal(check.includedSamples.includes("package.json"), true);
    } finally {
      rmSync(cwd, { force: true, recursive: true });
    }
  });

  it("blocks when ignored high-risk paths would be uploaded", () => {
    const cwd = makeTempWorkspace();

    writeMinimalProject(cwd, ".env\n");
    writeWorkspaceFile(cwd, ".env.local", "SUPABASE_SERVICE_ROLE_KEY=not-read\n");
    writeWorkspaceFile(cwd, "backups/db.sql", "not read\n");
    writeWorkspaceFile(cwd, "dev-server.log", "local log\n");

    try {
      const check = buildVercelUploadPackageCheck({ cwd });

      assert.equal(check.ok, false);
      assert.equal(check.highRiskIncludedPaths.includes(".env.local"), true);
      assert.equal(check.highRiskIncludedPaths.includes("backups/"), true);
      assert.equal(check.highRiskIncludedPaths.includes("dev-server.log"), true);
    } finally {
      rmSync(cwd, { force: true, recursive: true });
    }
  });

  it("blocks when required project paths are missing", () => {
    const cwd = makeTempWorkspace();

    writeWorkspaceFile(cwd, ".vercelignore", `${completeVercelIgnore}\n`);
    writeWorkspaceFile(cwd, "package.json", "{}\n");

    try {
      const check = buildVercelUploadPackageCheck({ cwd });

      assert.equal(check.ok, false);
      assert.equal(check.requiredPathSummary.missing.includes("app"), true);
      assert.equal(check.requiredPathSummary.missing.includes("src"), true);
      assert.equal(check.blockers.some((blocker) => blocker.includes("missing required project paths")), true);
    } finally {
      rmSync(cwd, { force: true, recursive: true });
    }
  });

  it("blocks sensitive-looking content in included files", () => {
    const cwd = makeTempWorkspace();

    writeMinimalProject(cwd, `${completeVercelIgnore}\n`);
    writeWorkspaceFile(cwd, "src/leak.ts", `const url = '${fakeDatabaseUrl}';\n`);

    try {
      const check = buildVercelUploadPackageCheck({ cwd });

      assert.equal(check.ok, false);
      assert.equal(check.sensitiveFindings.some((finding) => finding.ruleId === "database-url-with-password"), true);
    } finally {
      rmSync(cwd, { force: true, recursive: true });
    }
  });

  it("formats command and execution boundary", () => {
    const cwd = makeTempWorkspace();

    writeMinimalProject(cwd, `${completeVercelIgnore}\n`);

    try {
      const markdown = formatVercelUploadPackageCheck(buildVercelUploadPackageCheck({ cwd }));

      assert.match(markdown, /Lexos Vercel Upload Package Check/);
      assert.match(markdown, /npm\.cmd run deploy:upload:check/);
      assert.match(markdown, /does not create a tarball/);
    } finally {
      rmSync(cwd, { force: true, recursive: true });
    }
  });
});
