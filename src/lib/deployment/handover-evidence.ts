export const HANDOVER_EVIDENCE_KIND = "lexos-handover-evidence-index";

export type HandoverEvidenceCategoryId =
  | "release-baseline"
  | "quality-gates"
  | "migration-security"
  | "backup-recovery"
  | "storage-deliverables"
  | "observability"
  | "tenant-boundary"
  | "business-smoke"
  | "release-package"
  | "signoff";

export type HandoverEvidenceItem = {
  id: string;
  categoryId: HandoverEvidenceCategoryId;
  title: string;
  required: boolean;
  ownerRole: string;
  command?: string;
  expectedEvidence: string[];
  archiveHint: string;
  manualOnly: boolean;
  writesData: boolean;
  notes: string[];
};

export type HandoverEvidenceIndex = {
  version: 1;
  app: "lexos";
  kind: typeof HANDOVER_EVIDENCE_KIND;
  generatedAt: string;
  owner: string;
  clientSignoffRef: string;
  releaseApprover: string;
  operationsOwner: string;
  securityReviewer: string;
  ok: boolean;
  summary: {
    total: number;
    required: number;
    manualOnly: number;
    writesData: number;
    commandBacked: number;
  };
  blockers: string[];
  warnings: string[];
  items: HandoverEvidenceItem[];
};

const defaultOwner = "未指定";
const defaultClientSignoffRef = "未指定";
const defaultReleaseApprover = "未指定";
const defaultOperationsOwner = "未指定";
const defaultSecurityReviewer = "未指定";

const secretLikePattern = /(?:service_role|database_url|db_url|password|secret|token|private_key|access_key|credential|短信|sms)/i;

export function getHandoverEvidenceConfigFromEnv(env: NodeJS.ProcessEnv = process.env): {
  clientSignoffRef: string;
  operationsOwner: string;
  owner: string;
  releaseApprover: string;
  securityReviewer: string;
} {
  return {
    clientSignoffRef: env.LEXOS_HANDOVER_CLIENT_SIGNOFF_REF || defaultClientSignoffRef,
    operationsOwner: env.LEXOS_HANDOVER_OPERATIONS_OWNER || defaultOperationsOwner,
    owner: env.LEXOS_HANDOVER_OWNER || defaultOwner,
    releaseApprover: env.LEXOS_HANDOVER_RELEASE_APPROVER || defaultReleaseApprover,
    securityReviewer: env.LEXOS_HANDOVER_SECURITY_REVIEWER || defaultSecurityReviewer,
  };
}

export function buildHandoverEvidenceIndex(options: {
  env?: NodeJS.ProcessEnv;
  generatedAt?: Date;
} = {}): HandoverEvidenceIndex {
  const config = getHandoverEvidenceConfigFromEnv(options.env ?? process.env);
  const items = buildHandoverEvidenceItems();
  const blockers: string[] = [];
  const warnings: string[] = [
    "本索引只定义最终交付证据的留存口径，不读取密钥值、不连接线上 Supabase、不执行迁移、不运行真实 smoke。",
    "真实闭环 smoke 会写入验收库，必须由交付负责人在允许写入的验收环境单独执行并归档输出。",
  ];

  if (config.owner === defaultOwner) {
    blockers.push("最终交付证据索引必须指定交付负责人，请设置 LEXOS_HANDOVER_OWNER。");
  }

  if (config.clientSignoffRef === defaultClientSignoffRef) {
    blockers.push("最终交付证据索引必须指定客户签收编号或签收文件引用，请设置 LEXOS_HANDOVER_CLIENT_SIGNOFF_REF。");
  }

  if (secretLikePattern.test(config.clientSignoffRef)) {
    blockers.push("客户签收引用只能填写签收编号、工单号或归档路径，不能包含 token、secret、连接串、访问密钥或短信服务信息。");
  }

  if (config.releaseApprover === defaultReleaseApprover) {
    warnings.push("建议设置 LEXOS_HANDOVER_RELEASE_APPROVER，便于区分交付执行人与发布批准人。");
  }

  if (config.operationsOwner === defaultOperationsOwner) {
    warnings.push("建议设置 LEXOS_HANDOVER_OPERATIONS_OWNER，便于上线后运维交接。");
  }

  if (config.securityReviewer === defaultSecurityReviewer) {
    warnings.push("建议设置 LEXOS_HANDOVER_SECURITY_REVIEWER，便于 RLS、密钥和敏感内容复核留痕。");
  }

  const summary = {
    total: items.length,
    required: items.filter((item) => item.required).length,
    manualOnly: items.filter((item) => item.manualOnly).length,
    writesData: items.filter((item) => item.writesData).length,
    commandBacked: items.filter((item) => item.command).length,
  };

  return {
    version: 1,
    app: "lexos",
    kind: HANDOVER_EVIDENCE_KIND,
    generatedAt: (options.generatedAt ?? new Date()).toISOString(),
    owner: config.owner,
    clientSignoffRef: config.clientSignoffRef,
    releaseApprover: config.releaseApprover,
    operationsOwner: config.operationsOwner,
    securityReviewer: config.securityReviewer,
    ok: blockers.length === 0,
    summary,
    blockers,
    warnings,
    items,
  };
}

export function formatHandoverEvidenceIndex(index: HandoverEvidenceIndex): string {
  const lines = [
    "# Lexos 最终交付证据索引",
    "",
    `生成时间：${index.generatedAt}`,
    `总体状态：${index.ok ? "通过，可进入人工签收" : "存在阻断项"}`,
    `交付负责人：${index.owner}`,
    `客户签收引用：${index.clientSignoffRef}`,
    `发布批准人：${index.releaseApprover}`,
    `运维交接人：${index.operationsOwner}`,
    `安全复核人：${index.securityReviewer}`,
    `证据项：${index.summary.total} 项，其中必需 ${index.summary.required} 项、命令支撑 ${index.summary.commandBacked} 项、人工项 ${index.summary.manualOnly} 项、会写数据 ${index.summary.writesData} 项`,
    "执行命令：`npm.cmd run handover:evidence:check`",
    "",
  ];

  if (index.blockers.length) {
    lines.push("## 阻断项", "");
    index.blockers.forEach((blocker) => lines.push(`- ${blocker}`));
    lines.push("");
  }

  if (index.warnings.length) {
    lines.push("## 提示", "");
    index.warnings.forEach((warning) => lines.push(`- ${warning}`));
    lines.push("");
  }

  lines.push("## 证据清单", "");
  lines.push("| 分类 | 证据项 | 负责人角色 | 命令 | 归档提示 |");
  lines.push("| --- | --- | --- | --- | --- |");
  index.items.forEach((item) => {
    lines.push(
      `| ${categoryTitle(item.categoryId)} | ${item.title} | ${item.ownerRole} | ${item.command ? `\`${item.command}\`` : "人工确认"} | ${item.archiveHint} |`,
    );
  });
  lines.push("");

  index.items.forEach((item) => {
    lines.push(`### ${item.title}`);
    lines.push(`- 性质：${item.required ? "必需" : "建议"}`);
    lines.push(`- 负责人角色：${item.ownerRole}`);
    lines.push(`- 执行方式：${item.command ? `\`${item.command}\`` : "人工确认"}`);
    lines.push(`- 人工项：${item.manualOnly ? "是" : "否"}`);
    lines.push(`- 写入数据：${item.writesData ? "是" : "否"}`);
    item.expectedEvidence.forEach((evidence) => lines.push(`- 留存证据：${evidence}`));
    lines.push(`- 归档提示：${item.archiveHint}`);
    item.notes.forEach((note) => lines.push(`- 说明：${note}`));
    lines.push("");
  });

  lines.push("## 执行边界", "");
  lines.push("- 本索引只输出证据留存要求，不自动创建证据包、不读取密钥值、不连接线上 Supabase。");
  lines.push("- 不执行数据库迁移、真实恢复、真实 Storage 操作、真实闭环 smoke 或业务写入。");
  lines.push("- 真实短信、新手保护期、新兵引流池、证据矩阵和 AI 辅助功能仍不在本期交付范围。");

  return lines.join("\n").trimEnd();
}

function buildHandoverEvidenceItems(): HandoverEvidenceItem[] {
  return [
    item("release-baseline", "release-baseline", "发布基线与版本记录", true, "交付负责人", undefined, [
      "发布版本、Git commit、构建时间、目标环境和回滚目标版本。",
      "最终验收元数据与交付包元数据一致。",
    ], "reports/final-acceptance 或交付工单的发布基线小节", true, false, [
      "不得在证据中记录 service role、数据库连接串、管理员密码或客户材料原文。",
    ]),
    item("quality-gates", "typecheck", "类型检查", true, "研发负责人", "npm.cmd run typecheck", [
      "TypeScript 检查通过输出。",
    ], "quality/typecheck.txt", false, false, ["Windows 环境优先使用 npm.cmd。"]),
    item("quality-gates", "unit-tests", "单元与领域测试", true, "研发负责人", "npm.cmd test", [
      "全部 Node test 用例通过输出。",
    ], "quality/node-test.txt", false, false, ["测试应覆盖业务闭环、风控、备份、部署核对和运维交付规则。"]),
    item("quality-gates", "lint-build", "Lint 与生产构建", true, "研发负责人", "npm.cmd run lint && npm.cmd run build", [
      "ESLint 通过输出。",
      "Next.js 生产构建通过输出。",
    ], "quality/lint-build.txt", false, false, ["如分开执行，应分别归档 lint 与 build 输出。"]),
    item("migration-security", "private-readiness", "私有化交付自检", true, "交付负责人", "npm.cmd run private:check", [
      "真实 Supabase 模式、必要变量、关键迁移、脚本和文档完整性结果。",
    ], "deployment/private-check.md", false, false, ["该命令只做本地结构与变量名核对，不确认远端迁移状态。"]),
    item("migration-security", "launch-readiness", "上线前 runbook 核对", true, "交付负责人", "npm.cmd run launch:check", [
      "迁移应用、RLS、真实 smoke、备份恢复、Storage bucket、环境变量和运维交接证据清单。",
    ], "deployment/launch-readiness.md", false, false, ["不自动执行 supabase db push。"]),
    item("migration-security", "rls-verification", "RLS / Data API 直接访问验证", true, "安全复核人", "npm.cmd run verify:rls", [
      "service role 可读、anon/authenticated 不能直接读取内部 public 表的验证输出。",
    ], "security/rls-direct-access.txt", true, false, ["需要在目标验收环境单独执行并归档。"]),
    item("backup-recovery", "backup-rehearsal", "备份调度安装、运行证据与恢复演练", true, "运维交接人", "npm.cmd run backup:task:check && npm.cmd run backup:run:check && npm.cmd run backup:rehearsal", [
      "系统任务运行账号、日志目录、最近成功备份时间、数据库备份目录、Storage 备份目录、manifest 和文件级恢复演练报告。",
    ], "backup/rehearsal-report.md", true, false, ["默认只生成核对清单并校验文件，不安装系统任务、不执行真实恢复。"]),
    item("backup-recovery", "backup-hardening", "备份加密、告警和异地镜像核对", true, "运维交接人", "npm.cmd run backup:encrypt:check && npm.cmd run backup:alert:check && npm.cmd run backup:mirror:check", [
      "离线加密核对、失败告警核对、异地/跨云镜像核对输出。",
    ], "backup/hardening-checks.md", false, false, ["当前只输出核对清单，不执行真实加密、通知或上传。"]),
    item("storage-deliverables", "storage-bucket", "私有交付附件 Storage 证据", true, "交付负责人", "npm.cmd run backup:storage -- --dry-run", [
      "lexos-deliverables 私有 bucket 核对、附件 manifest、客户验证码授权下载边界说明。",
    ], "storage/deliverables-storage.md", true, false, ["客户侧仍沿用 token + 手机号 + 演示验证码链路，不接真实短信。"]),
    item("observability", "ops-logs", "运维、错误和性能日志制度", true, "运维交接人", "npm.cmd run ops:log:check && npm.cmd run error:log:check && npm.cmd run perf:check", [
      "发布、迁移、备份、恢复、安全核对、异常处置、错误脱敏和性能阈值留痕口径。",
    ], "operations/logging-and-performance.md", false, false, ["当前不采集真实用户数据，不接入外部 APM。"]),
    item("tenant-boundary", "tenant-isolation", "多律所租户隔离核对", true, "安全复核人", "npm.cmd run tenant:check", [
      "租户表 organization_id、关键 API 组织过滤、Storage 路径隔离和人工负向测试清单。",
    ], "security/tenant-isolation.md", false, false, ["正式多律所上线前仍需在验收库执行跨组织负向测试。"]),
    item("business-smoke", "real-smoke", "真实闭环 smoke 验收", true, "交付负责人", "npm.cmd run smoke:real", [
      "管理员、案源律师、办案律师、客户确认、财务结算闭环成功输出。",
      "真实任务 ID、结算 ID 和最终 confirmed 状态。",
    ], "smoke/real-flow.txt", true, true, ["该命令会写入客户、任务、反馈和结算记录，只能在允许写入的验收库执行。"]),
    item("release-package", "release-package-check", "交付包清单与敏感内容扫描", true, "交付负责人", "npm.cmd run release:package:check && npm.cmd run release:sensitive:check", [
      "交付包根文件、目录、脚本、迁移、文档完整性。",
      "敏感内容扫描 0 阻断输出。",
    ], "release/package-and-sensitive-scan.md", false, false, ["交付包不得包含 .env.local、reports、backups、node_modules 或构建缓存。"]),
    item("release-package", "final-gate", "最终门禁汇总", true, "交付负责人", "npm.cmd run final:gate:check", [
      "私有化自检、上线 runbook、升级核对、最终验收、交付包和敏感扫描的聚合结果。",
    ], "release/final-gate.md", false, false, ["该门禁只读聚合，不运行真实 smoke。"]),
    item("release-package", "post-deployment-verification", "部署后回归核对清单", true, "交付负责人/运维负责人", "npm.cmd run postdeploy:check", [
      "上线后健康检查、核心页面、RLS、客户附件、导出审计、备份恢复、日志性能、回滚窗口和观察期证据清单。",
    ], "release/post-deployment-verification.md", false, false, ["该清单只读生成核对项，不连接线上 Supabase、不执行真实 smoke、不写入业务数据。"]),
    item("signoff", "client-signoff", "客户签收与剩余风险确认", true, "客户代表/交付负责人", undefined, [
      "客户签收编号或签收文件引用。",
      "本期暂缓范围、剩余风险、上线后联系人和回滚窗口确认。",
    ], "signoff/client-signoff.md", true, false, ["真实短信、新手保护期、新兵引流池、证据矩阵和 AI 辅助功能需明确列为本期不交付。"]),
  ];
}

function item(
  categoryId: HandoverEvidenceCategoryId,
  id: string,
  title: string,
  required: boolean,
  ownerRole: string,
  command: string | undefined,
  expectedEvidence: string[],
  archiveHint: string,
  manualOnly: boolean,
  writesData: boolean,
  notes: string[],
): HandoverEvidenceItem {
  return {
    id,
    categoryId,
    title,
    required,
    ownerRole,
    command,
    expectedEvidence,
    archiveHint,
    manualOnly,
    writesData,
    notes,
  };
}

function categoryTitle(categoryId: HandoverEvidenceCategoryId): string {
  const titles: Record<HandoverEvidenceCategoryId, string> = {
    "backup-recovery": "备份恢复",
    "business-smoke": "业务验收",
    "migration-security": "迁移安全",
    observability: "运维观测",
    "quality-gates": "质量门槛",
    "release-baseline": "发布基线",
    "release-package": "交付包",
    signoff: "签收",
    "storage-deliverables": "交付附件",
    "tenant-boundary": "租户边界",
  };

  return titles[categoryId];
}
