import {
  buildPrivateDeploymentReadiness,
  readPrivateReadinessInventory,
  type PrivateReadinessInventory,
} from "./private-readiness.ts";
import { buildLaunchReadinessRunbook } from "./launch-readiness.ts";
import { buildUpgradeReadinessPlan } from "./upgrade-readiness.ts";
import { buildFinalDeploymentAcceptance } from "./final-acceptance.ts";
import {
  buildDeploymentChannelReadiness,
  readDeploymentChannelInventory,
  type DeploymentChannelInventory,
} from "./deployment-channel.ts";
import {
  buildVercelUploadPackageCheck,
  type VercelUploadPackageCheck,
} from "./vercel-upload-package.ts";
import {
  buildVercelPreviewDeploymentEvidence,
  type VercelPreviewDeploymentEvidence,
} from "./preview-deployment-evidence.ts";
import { buildHandoverEvidenceIndex } from "./handover-evidence.ts";
import { buildPostDeploymentVerification } from "./post-deployment-verification.ts";
import {
  buildReleasePackageCheck,
  readReleasePackageInventory,
  type ReleasePackageInventory,
} from "./release-package.ts";
import {
  buildReleaseSensitiveScanReport,
  type ReleaseSensitiveScanReport,
} from "./release-sensitive-scan.ts";

export const FINAL_GATE_KIND = "lexos-final-deployment-gate";

export type FinalGateCheckId =
  | "private-readiness"
  | "launch-readiness"
  | "upgrade-readiness"
  | "deployment-channel"
  | "vercel-upload-package"
  | "vercel-preview-evidence"
  | "final-acceptance"
  | "handover-evidence"
  | "post-deployment-verification"
  | "release-package"
  | "release-sensitive-scan";

export type FinalGateCheck = {
  id: FinalGateCheckId;
  title: string;
  command: string;
  ok: boolean;
  blockerCount: number;
  warningCount: number;
  reviewCount?: number;
  blockers: string[];
  warnings: string[];
  notes: string[];
};

export type FinalDeploymentGate = {
  version: 1;
  app: "lexos";
  kind: typeof FINAL_GATE_KIND;
  generatedAt: string;
  ok: boolean;
  checks: FinalGateCheck[];
  blockers: string[];
  warnings: string[];
};

export function buildFinalDeploymentGate(options: {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  generatedAt?: Date;
  inventory?: PrivateReadinessInventory;
  deploymentChannelInventory?: DeploymentChannelInventory;
  vercelUploadPackageCheck?: VercelUploadPackageCheck;
  vercelPreviewDeploymentEvidence?: VercelPreviewDeploymentEvidence;
  releasePackageInventory?: ReleasePackageInventory;
  releaseSensitiveScan?: ReleaseSensitiveScanReport;
} = {}): FinalDeploymentGate {
  const cwd = options.cwd ?? process.cwd();
  const env = options.env ?? process.env;
  const generatedAt = options.generatedAt ?? new Date();
  const inventory = options.inventory ?? readPrivateReadinessInventory(cwd);
  const releasePackageInventory = options.releasePackageInventory ?? readReleasePackageInventory(cwd);
  const privateReadiness = buildPrivateDeploymentReadiness(env, inventory);
  const launchReadiness = buildLaunchReadinessRunbook({ env, generatedAt, inventory });
  const upgradeReadiness = buildUpgradeReadinessPlan({ cwd, env, generatedAt, inventory });
  const deploymentChannel = buildDeploymentChannelReadiness({
    cwd,
    env,
    generatedAt,
    inventory: options.deploymentChannelInventory ?? readDeploymentChannelInventory(cwd, env),
  });
  const vercelUploadPackage =
    options.vercelUploadPackageCheck ?? buildVercelUploadPackageCheck({ cwd, generatedAt });
  const vercelPreviewDeploymentEvidence =
    options.vercelPreviewDeploymentEvidence ?? buildVercelPreviewDeploymentEvidence({ env, generatedAt });
  const finalAcceptance = buildFinalDeploymentAcceptance({ env, generatedAt, inventory });
  const handoverEvidence = buildHandoverEvidenceIndex({ env, generatedAt });
  const postDeploymentVerification = buildPostDeploymentVerification({ env, generatedAt });
  const releasePackage = buildReleasePackageCheck({
    cwd,
    env,
    generatedAt,
    inventory: releasePackageInventory,
  });
  const releaseSensitiveScan =
    options.releaseSensitiveScan ?? buildReleaseSensitiveScanReport({ cwd, generatedAt });

  const checks: FinalGateCheck[] = [
    {
      id: "private-readiness",
      title: "私有化交付自检",
      command: "npm.cmd run private:check",
      ok: privateReadiness.ok,
      blockerCount: privateReadiness.blockers.length,
      warningCount: privateReadiness.warnings.length,
      blockers: privateReadiness.blockers,
      warnings: privateReadiness.warnings,
      notes: [
        `运行模式：${privateReadiness.mode === "supabase" ? "真实 Supabase" : "内存 demo"}`,
        `关键迁移：${privateReadiness.migrationSummary.required - privateReadiness.migrationSummary.missing.length}/${privateReadiness.migrationSummary.required}`,
      ],
    },
    {
      id: "launch-readiness",
      title: "上线前 runbook 核对",
      command: "npm.cmd run launch:check",
      ok: launchReadiness.ok,
      blockerCount: launchReadiness.blockers.length,
      warningCount: launchReadiness.warnings.length,
      blockers: launchReadiness.blockers,
      warnings: launchReadiness.warnings,
      notes: [
        `关键迁移：${launchReadiness.migrationSummary.present}/${launchReadiness.migrationSummary.required}`,
        "该项只汇总上线前证据清单，不自动执行 supabase db push 或真实 smoke。",
      ],
    },
    {
      id: "upgrade-readiness",
      title: "升级迁移核对",
      command: "npm.cmd run upgrade:check",
      ok: upgradeReadiness.ok,
      blockerCount: upgradeReadiness.blockers.length,
      warningCount: upgradeReadiness.warnings.length,
      blockers: upgradeReadiness.blockers,
      warnings: upgradeReadiness.warnings,
      notes: [
        `目标版本：${upgradeReadiness.targetVersion}`,
        `迁移状态来源：${upgradeReadiness.appliedMigrationSource === "env" ? "环境变量" : "人工核对"}`,
      ],
    },
    {
      id: "deployment-channel",
      title: "Vercel deployment channel",
      command: "npm.cmd run deploy:channel:check",
      ok: deploymentChannel.ok,
      blockerCount: deploymentChannel.blockers.length,
      warningCount: deploymentChannel.warnings.length,
      blockers: deploymentChannel.blockers,
      warnings: deploymentChannel.warnings,
      notes: [
        `Provider: ${deploymentChannel.provider}`,
        `Target: ${deploymentChannel.target}`,
        `Method: ${deploymentChannel.method}`,
        `Git remote: ${deploymentChannel.inventory.gitRemoteUrl ?? "not found"}`,
        `Vercel CLI: ${deploymentChannel.inventory.hasVercelCli ? "available" : "not found"}`,
        `Vercel ignore: ${deploymentChannel.inventory.hasVercelIgnore ? "present" : "missing"}`,
      ],
    },
    {
      id: "vercel-upload-package",
      title: "Vercel upload package",
      command: "npm.cmd run deploy:upload:check",
      ok: vercelUploadPackage.ok,
      blockerCount: vercelUploadPackage.blockers.length,
      warningCount: vercelUploadPackage.warnings.length,
      blockers: vercelUploadPackage.blockers,
      warnings: vercelUploadPackage.warnings,
      notes: [
        `Included files: ${vercelUploadPackage.includedFileCount}`,
        `Included bytes: ${vercelUploadPackage.includedBytes}`,
        `High-risk paths: ${vercelUploadPackage.highRiskIncludedPaths.length}`,
        `Sensitive findings: ${vercelUploadPackage.sensitiveFindings.length}`,
      ],
    },
    {
      id: "vercel-preview-evidence",
      title: "Vercel Preview deployment evidence",
      command: "npm.cmd run deploy:preview:evidence",
      ok: vercelPreviewDeploymentEvidence.ok,
      blockerCount: vercelPreviewDeploymentEvidence.blockers.length,
      warningCount: vercelPreviewDeploymentEvidence.warnings.length,
      blockers: vercelPreviewDeploymentEvidence.blockers,
      warnings: vercelPreviewDeploymentEvidence.warnings,
      notes: [
        `Preview URL: ${vercelPreviewDeploymentEvidence.previewUrl}`,
        `Deployment ref: ${vercelPreviewDeploymentEvidence.deploymentRef}`,
        `Build log ref: ${vercelPreviewDeploymentEvidence.buildLogRef}`,
        `Smoke ref: ${vercelPreviewDeploymentEvidence.smokeRef}`,
        `Owner: ${vercelPreviewDeploymentEvidence.owner}`,
        `Deployed at: ${vercelPreviewDeploymentEvidence.deployedAt}`,
      ],
    },
    {
      id: "final-acceptance",
      title: "最终部署验收",
      command: "npm.cmd run final:acceptance",
      ok: finalAcceptance.ok,
      blockerCount: finalAcceptance.blockers.length,
      warningCount: finalAcceptance.warnings.length,
      blockers: finalAcceptance.blockers,
      warnings: finalAcceptance.warnings,
      notes: [
        `目标环境：${finalAcceptance.environment}`,
        `发布版本：${finalAcceptance.releaseVersion}`,
        `证据归档：${finalAcceptance.evidenceRef}`,
      ],
    },
    {
      id: "release-package",
      title: "私有化交付包清单",
      command: "npm.cmd run release:package:check",
      ok: releasePackage.ok,
      blockerCount: releasePackage.blockers.length,
      warningCount: releasePackage.warnings.length,
      blockers: releasePackage.blockers,
      warnings: releasePackage.warnings,
      notes: [
        `交付版本：${releasePackage.releaseVersion}`,
        `目标环境：${releasePackage.targetEnvironment}`,
        `维护人：${releasePackage.maintainer}`,
      ],
    },
    {
      id: "handover-evidence",
      title: "最终交付证据索引",
      command: "npm.cmd run handover:evidence:check",
      ok: handoverEvidence.ok,
      blockerCount: handoverEvidence.blockers.length,
      warningCount: handoverEvidence.warnings.length,
      blockers: handoverEvidence.blockers,
      warnings: handoverEvidence.warnings,
      notes: [
        `交付负责人：${handoverEvidence.owner}`,
        `客户签收引用：${handoverEvidence.clientSignoffRef}`,
        `证据项：${handoverEvidence.summary.total}`,
        `会写数据项：${handoverEvidence.summary.writesData}`,
      ],
    },
    {
      id: "post-deployment-verification",
      title: "部署后回归核对",
      command: "npm.cmd run postdeploy:check",
      ok: postDeploymentVerification.ok,
      blockerCount: postDeploymentVerification.blockers.length,
      warningCount: postDeploymentVerification.warnings.length,
      blockers: postDeploymentVerification.blockers,
      warnings: postDeploymentVerification.warnings,
      notes: [
        `目标环境：${postDeploymentVerification.environment}`,
        `发布版本：${postDeploymentVerification.releaseVersion}`,
        `应用地址：${postDeploymentVerification.baseUrl}`,
        `核对项：${postDeploymentVerification.summary.total}`,
      ],
    },
    {
      id: "release-sensitive-scan",
      title: "交付包敏感内容扫描",
      command: "npm.cmd run release:sensitive:check",
      ok: releaseSensitiveScan.ok,
      blockerCount: releaseSensitiveScan.blockers.length,
      warningCount: releaseSensitiveScan.warnings.length + releaseSensitiveScan.reviewItems.length,
      reviewCount: releaseSensitiveScan.reviewItems.length,
      blockers: releaseSensitiveScan.blockers.map(formatSensitiveFinding),
      warnings: [
        ...releaseSensitiveScan.warnings,
        ...releaseSensitiveScan.reviewItems.map(formatSensitiveFinding),
      ],
      notes: [
        `扫描文件：${releaseSensitiveScan.scannedFiles}`,
        `人工复核项：${releaseSensitiveScan.reviewItems.length}`,
      ],
    },
  ];
  const blockers = flattenIssues(checks, "blockers");
  const warnings = flattenIssues(checks, "warnings");

  return {
    version: 1,
    app: "lexos",
    kind: FINAL_GATE_KIND,
    generatedAt: generatedAt.toISOString(),
    ok: blockers.length === 0 && checks.every((check) => check.ok),
    checks,
    blockers,
    warnings,
  };
}

export function formatFinalDeploymentGate(gate: FinalDeploymentGate): string {
  const lines = [
    "# Lexos 最终部署验收门禁汇总",
    "",
    `生成时间：${gate.generatedAt}`,
    `总体状态：${gate.ok ? "通过，可进入人工签收" : "存在阻断项"}`,
    `检查项：${gate.checks.length}`,
    `阻断项：${gate.blockers.length}`,
    `提示/人工复核项：${gate.warnings.length}`,
    "执行命令：`npm.cmd run final:gate:check`",
    "",
    "## 检查项",
    "",
    "| 检查 | 命令 | 状态 | 阻断 | 提示/复核 |",
    "| --- | --- | --- | ---: | ---: |",
    ...gate.checks.map((check) => (
      `| ${check.title} | \`${check.command}\` | ${check.ok ? "通过" : "未通过"} | ${check.blockerCount} | ${check.warningCount} |`
    )),
    "",
  ];

  if (gate.blockers.length) {
    lines.push("## 阻断项", "");
    gate.blockers.forEach((blocker) => lines.push(`- ${blocker}`));
    lines.push("");
  }

  if (gate.warnings.length) {
    lines.push("## 提示与人工复核", "");
    gate.warnings.forEach((warning) => lines.push(`- ${warning}`));
    lines.push("");
  }

  lines.push("## 检查详情", "");

  gate.checks.forEach((check) => {
    lines.push(`### ${check.title}`);
    lines.push(`- 命令：\`${check.command}\``);
    lines.push(`- 状态：${check.ok ? "通过" : "未通过"}`);
    lines.push(`- 阻断项：${check.blockerCount}`);
    lines.push(`- 提示/复核项：${check.warningCount}`);

    if (typeof check.reviewCount === "number") {
      lines.push(`- 人工复核项：${check.reviewCount}`);
    }

    check.notes.forEach((note) => lines.push(`- 说明：${note}`));
    lines.push("");
  });

  lines.push("## 执行边界", "");
  lines.push("- 本门禁只读聚合本地检查结果，不连接线上 Supabase。");
  lines.push("- 不执行数据库迁移，不运行真实闭环 smoke，不写入业务数据。");
  lines.push("- 可读取 `.env.local` 注入环境变量供规则判断，但不会输出密钥值。");
  lines.push("- 真实短信、新手保护期、新兵引流池、证据矩阵和 AI 辅助功能仍不在本期开发范围。");

  return lines.join("\n").trimEnd();
}

function flattenIssues(checks: FinalGateCheck[], field: "blockers" | "warnings"): string[] {
  return checks.flatMap((check) => check[field].map((issue) => `[${check.title}] ${issue}`));
}

function formatSensitiveFinding(finding: ReleaseSensitiveScanReport["blockers"][number]): string {
  return `${finding.filePath}:${finding.line} [${finding.ruleId}] ${finding.message}`;
}
