import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import {
  buildReleaseSensitiveScanReport,
  formatReleaseSensitiveScanReport,
} from "../src/lib/deployment/release-sensitive-scan.ts";

function makeTempWorkspace(): string {
  return path.join(os.tmpdir(), `lexos-sensitive-scan-${Date.now()}-${Math.random().toString(16).slice(2)}`);
}

function writeWorkspaceFile(cwd: string, filePath: string, content: string): void {
  const absolutePath = path.join(cwd, ...filePath.split("/"));
  mkdirSync(path.dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, "utf8");
}

describe("私有化交付包敏感内容扫描", () => {
  it("允许范围内无真实密钥样式时通过", () => {
    const cwd = makeTempWorkspace();

    writeWorkspaceFile(cwd, "src/index.ts", "export const demoMode = true;\n");
    writeWorkspaceFile(cwd, "docs/release-sensitive-scan.md", "# 扫描说明\n");

    try {
      const report = buildReleaseSensitiveScanReport({
        cwd,
        generatedAt: new Date("2026-06-10T00:00:00.000Z"),
      });

      assert.equal(report.ok, true);
      assert.equal(report.scannedFiles, 2);
      assert.deepEqual(report.blockers, []);
      assert.equal(formatReleaseSensitiveScanReport(report).includes("Lexos 私有化交付包敏感内容扫描"), true);
    } finally {
      rmSync(cwd, { force: true, recursive: true });
    }
  });

  it("发现真实连接串或密钥样式时阻断", () => {
    const cwd = makeTempWorkspace();

    const leakedDatabaseUrl = "postgres://lexos" + ":real-password@example.supabase.co:5432/postgres";
    writeWorkspaceFile(cwd, "src/leak.ts", `const db = '${leakedDatabaseUrl}';\n`);

    try {
      const report = buildReleaseSensitiveScanReport({ cwd });

      assert.equal(report.ok, false);
      assert.equal(report.blockers.some((finding) => finding.ruleId === "database-url-with-password"), true);
      assert.equal(report.blockers[0]?.filePath, "src/leak.ts");
    } finally {
      rmSync(cwd, { force: true, recursive: true });
    }
  });

  it("跳过 .env.local、报告、备份和依赖目录", () => {
    const cwd = makeTempWorkspace();

    const skippedOpenAiKey = "sk-" + "realrealrealrealrealrealreal";
    const skippedDatabaseUrl = "postgres://lexos" + ":real-password@example.supabase.co/postgres";
    const skippedGithubToken = "ghp_" + "123456789012345678901234567890123456";
    writeWorkspaceFile(cwd, ".env.local", `OPENAI_API_KEY=${skippedOpenAiKey}\n`);
    writeWorkspaceFile(cwd, "reports/leak.md", `${skippedDatabaseUrl}\n`);
    writeWorkspaceFile(cwd, "node_modules/pkg/index.js", `const token = '${skippedGithubToken}';\n`);
    writeWorkspaceFile(cwd, "src/clean.ts", "export const ok = true;\n");

    try {
      const report = buildReleaseSensitiveScanReport({ cwd });

      assert.equal(report.ok, true);
      assert.equal(report.scannedFiles, 1);
      assert.deepEqual(report.blockers, []);
      assert.equal(report.excludedPaths.includes(".env.local"), true);
    } finally {
      rmSync(cwd, { force: true, recursive: true });
    }
  });

  it("暂缓功能或真实短信线索进入人工复核项，不直接阻断", () => {
    const cwd = makeTempWorkspace();

    writeWorkspaceFile(cwd, "src/notice.ts", "const note = '真实短信接入暂不开发，AI 辅助暂不开发，新手保护期暂缓';\n");
    writeWorkspaceFile(cwd, "docs/roadmap.md", "真实短信、AI 辅助和证据矩阵只是边界说明。\n");

    try {
      const report = buildReleaseSensitiveScanReport({ cwd });

      assert.equal(report.ok, true);
      assert.equal(report.reviewItems.some((finding) => finding.ruleId === "sms-capability-trace"), true);
      assert.equal(report.reviewItems.some((finding) => finding.ruleId === "ai-capability-trace"), true);
      assert.equal(report.reviewItems.some((finding) => finding.ruleId === "forbidden-roadmap-trace"), true);
      assert.equal(report.reviewItems.some((finding) => finding.filePath === "docs/roadmap.md"), false);
    } finally {
      rmSync(cwd, { force: true, recursive: true });
    }
  });
});
