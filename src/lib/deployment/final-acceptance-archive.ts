import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  formatFinalDeploymentAcceptance,
  type FinalDeploymentAcceptance,
} from "./final-acceptance.ts";

export type FinalAcceptanceArchivePlan = {
  outputDir: string;
  markdownPath: string;
  jsonPath: string;
  baseName: string;
  markdown: string;
  json: string;
  blockers: string[];
  warnings: string[];
  write: boolean;
};

const defaultArchiveDir = "reports/final-acceptance";
const secretLikePattern = /(?:service_role|database_url|db_url|password|secret|token|private_key|access_key|credential|短信|sms)/i;

export function getFinalAcceptanceArchiveConfigFromEnv(env: NodeJS.ProcessEnv = process.env): {
  outputDir: string;
} {
  return {
    outputDir: env.LEXOS_FINAL_ACCEPTANCE_ARCHIVE_DIR || defaultArchiveDir,
  };
}

export function buildFinalAcceptanceArchivePlan(options: {
  cwd?: string;
  outputDir?: string;
  report: FinalDeploymentAcceptance;
  write?: boolean;
}): FinalAcceptanceArchivePlan {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const requestedOutputDir = options.outputDir || defaultArchiveDir;
  const outputDir = path.resolve(cwd, requestedOutputDir);
  const blockers: string[] = [];
  const warnings: string[] = [];
  const timestamp = options.report.generatedAt.replace(/[:.]/g, "-");
  const baseName = sanitizeArchiveSegment([
    "lexos-final-acceptance",
    options.report.releaseVersion,
    options.report.evidenceRef,
    timestamp,
  ].join("-"));
  const markdownPath = path.join(outputDir, `${baseName}.md`);
  const jsonPath = path.join(outputDir, `${baseName}.json`);
  const markdown = formatFinalDeploymentAcceptance(options.report);
  const json = `${JSON.stringify(options.report, null, 2)}\n`;

  if (!options.report.ok) {
    blockers.push("最终验收报告仍存在阻断项，不能归档为正式证据包。");
  }

  if (!isInsideDirectory(outputDir, cwd)) {
    blockers.push("最终验收归档目录必须位于当前项目工作区内。");
  }

  if (secretLikePattern.test(requestedOutputDir)) {
    blockers.push("最终验收归档目录不能包含 token、secret、连接串、访问密钥或短信服务信息。");
  }

  if (isPublicLikePath(outputDir)) {
    blockers.push("最终验收归档目录不能位于 public、.next、app 或 src 等可发布/源码目录。");
  }

  warnings.push("归档脚本只写入本地 Markdown 和 JSON 报告，不连接线上 Supabase，不执行迁移，不写入业务数据。");
  warnings.push("归档报告只应保存证据编号和命令输出摘要，不应追加密钥、数据库连接串、恢复口令或客户材料原文。");

  return {
    outputDir,
    markdownPath,
    jsonPath,
    baseName,
    markdown,
    json,
    blockers,
    warnings,
    write: options.write ?? true,
  };
}

export function writeFinalAcceptanceArchive(plan: FinalAcceptanceArchivePlan): void {
  if (!plan.write || plan.blockers.length) {
    return;
  }

  mkdirSync(plan.outputDir, { recursive: true });
  writeFileSync(plan.markdownPath, plan.markdown, "utf8");
  writeFileSync(plan.jsonPath, plan.json, "utf8");
}

export function formatFinalAcceptanceArchivePlan(plan: FinalAcceptanceArchivePlan): string {
  return [
    `Lexos 最终验收证据包归档：${plan.blockers.length ? "未通过" : plan.write ? "已准备写入" : "演练通过"}`,
    `输出目录：${plan.outputDir}`,
    `Markdown：${plan.markdownPath}`,
    `JSON：${plan.jsonPath}`,
    `写入模式：${plan.write ? "写入文件" : "只演练不写入"}`,
    formatIssues("阻断项", plan.blockers),
    formatIssues("提示", plan.warnings),
  ].filter(Boolean).join("\n");
}

function sanitizeArchiveSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    || "lexos-final-acceptance";
}

function isInsideDirectory(targetPath: string, rootPath: string): boolean {
  const relative = path.relative(rootPath, targetPath);

  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function isPublicLikePath(outputDir: string): boolean {
  return outputDir.split(path.sep).some((segment) => ["public", ".next", "app", "src"].includes(segment));
}

function formatIssues(title: string, issues: string[]): string {
  if (!issues.length) {
    return "";
  }

  return [
    `${title}：`,
    ...issues.map((issue) => `- ${issue}`),
  ].join("\n");
}
