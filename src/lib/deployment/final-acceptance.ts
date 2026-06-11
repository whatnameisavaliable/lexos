import {
  buildPrivateDeploymentReadiness,
  readPrivateReadinessInventory,
  requiredPrivateMigrationFiles,
  type PrivateDeploymentReadiness,
  type PrivateReadinessInventory,
} from "./private-readiness.ts";

export const FINAL_ACCEPTANCE_KIND = "lexos-final-deployment-acceptance";

export type FinalAcceptanceSectionId =
  | "release-baseline"
  | "quality-gates"
  | "migration-security"
  | "storage-deliverables"
  | "backup-recovery"
  | "operations-observability"
  | "tenant-boundary"
  | "business-smoke"
  | "handover";

export type FinalAcceptanceItem = {
  id: string;
  title: string;
  required: boolean;
  command?: string;
  evidence: string;
  notes: string[];
};

export type FinalAcceptanceSection = {
  id: FinalAcceptanceSectionId;
  title: string;
  items: FinalAcceptanceItem[];
};

export type FinalDeploymentAcceptance = {
  version: 1;
  app: "lexos";
  kind: typeof FINAL_ACCEPTANCE_KIND;
  generatedAt: string;
  owner: string;
  environment: string;
  releaseVersion: string;
  evidenceRef: string;
  ok: boolean;
  privateReadiness: PrivateDeploymentReadiness;
  scriptSummary: {
    required: number;
    missing: string[];
  };
  docSummary: {
    required: number;
    missing: string[];
  };
  blockers: string[];
  warnings: string[];
  sections: FinalAcceptanceSection[];
};

const defaultOwner = "未指定";
const defaultEnvironment = "未指定";
const defaultReleaseVersion = "未指定";
const defaultEvidenceRef = "未指定";

export const requiredFinalAcceptanceScripts = [
  "build",
  "typecheck",
  "test",
  "private:check",
  "launch:check",
  "upgrade:check",
  "deploy:channel:check",
  "deploy:upload:check",
  "deploy:preview:request",
  "deploy:preview:evidence",
  "final:acceptance",
  "final:gate:check",
  "handover:evidence:check",
  "postdeploy:check",
  "release:package:check",
  "release:sensitive:check",
  "verify:rls",
  "smoke:real",
  "backup:db",
  "restore:db",
  "backup:storage",
  "restore:storage",
  "backup:schedule",
  "backup:task:check",
  "backup:run:check",
  "backup:rehearsal",
  "backup:encrypt:check",
  "backup:alert:check",
  "backup:mirror:check",
  "ops:log:check",
  "error:log:check",
  "perf:check",
  "tenant:check",
] as const;

export const requiredFinalAcceptanceDocs = [
  "docs/deployment.md",
  "docs/private-deployment.md",
  "docs/launch-readiness.md",
  "docs/upgrade-runbook.md",
  "docs/deployment-channel.md",
  "docs/vercel-upload-package.md",
  "docs/vercel-preview-request.md",
  "docs/vercel-preview-evidence.md",
  "docs/final-deployment-acceptance.md",
  "docs/final-gate.md",
  "docs/handover-evidence.md",
  "docs/post-deployment-verification.md",
  "docs/release-package.md",
  "docs/release-sensitive-scan.md",
  "docs/backup-restore.md",
  "docs/storage-backup.md",
  "docs/backup-operations.md",
  "docs/backup-task-installation.md",
  "docs/backup-run-evidence.md",
  "docs/backup-encryption.md",
  "docs/backup-alerts.md",
  "docs/backup-mirror.md",
  "docs/operations-log.md",
  "docs/error-log.md",
  "docs/performance-monitoring.md",
  "docs/tenant-isolation.md",
  "docs/testing.md",
] as const;

const secretLikePattern = /(?:service_role|database_url|db_url|password|secret|token|private_key|access_key|credential|短信|sms)/i;

export function getFinalAcceptanceConfigFromEnv(env: NodeJS.ProcessEnv = process.env): {
  environment: string;
  evidenceRef: string;
  owner: string;
  releaseVersion: string;
} {
  return {
    environment: env.LEXOS_FINAL_ACCEPTANCE_ENVIRONMENT || defaultEnvironment,
    evidenceRef: env.LEXOS_FINAL_ACCEPTANCE_EVIDENCE_REF || defaultEvidenceRef,
    owner: env.LEXOS_FINAL_ACCEPTANCE_OWNER || defaultOwner,
    releaseVersion: env.LEXOS_FINAL_ACCEPTANCE_RELEASE_VERSION || defaultReleaseVersion,
  };
}

export function buildFinalDeploymentAcceptance(options: {
  env?: NodeJS.ProcessEnv;
  generatedAt?: Date;
  inventory?: PrivateReadinessInventory;
} = {}): FinalDeploymentAcceptance {
  const env = options.env ?? process.env;
  const inventory = options.inventory ?? readPrivateReadinessInventory();
  const privateReadiness = buildPrivateDeploymentReadiness(env, inventory);
  const config = getFinalAcceptanceConfigFromEnv(env);
  const missingScripts = requiredFinalAcceptanceScripts.filter((scriptName) => !inventory.packageScripts.includes(scriptName));
  const missingDocs = requiredFinalAcceptanceDocs.filter((docPath) => !inventory.docs.includes(docPath));
  const blockers = [
    ...privateReadiness.blockers,
    ...missingScripts.map((scriptName) => `最终部署验收所需 npm script 缺失：${scriptName}。`),
    ...missingDocs.map((docPath) => `最终部署验收所需文档缺失：${docPath}。`),
  ];
  const warnings = [
    ...privateReadiness.warnings,
    "本验收报告只汇总本地交付前置条件和人工证据要求，不连接线上 Supabase，不执行迁移，不写入业务数据。",
    "真实闭环 smoke、RLS 验证、备份恢复和部署后页面复核仍需由交付负责人在目标环境单独执行并归档输出。",
  ];

  if (config.owner === defaultOwner) {
    blockers.push("最终部署验收必须指定验收负责人，请设置 LEXOS_FINAL_ACCEPTANCE_OWNER。");
  }

  if (config.environment === defaultEnvironment) {
    blockers.push("最终部署验收必须指定目标环境，请设置 LEXOS_FINAL_ACCEPTANCE_ENVIRONMENT。");
  }

  if (config.releaseVersion === defaultReleaseVersion) {
    blockers.push("最终部署验收必须指定发布版本，请设置 LEXOS_FINAL_ACCEPTANCE_RELEASE_VERSION。");
  }

  if (config.evidenceRef === defaultEvidenceRef) {
    blockers.push("最终部署验收必须指定证据归档编号或目录，请设置 LEXOS_FINAL_ACCEPTANCE_EVIDENCE_REF。");
  }

  if (secretLikePattern.test(config.evidenceRef)) {
    blockers.push("证据归档编号只能填写目录、工单或归档编号，不能包含 token、secret、连接串、访问密钥或短信服务信息。");
  }

  return {
    version: 1,
    app: "lexos",
    kind: FINAL_ACCEPTANCE_KIND,
    generatedAt: (options.generatedAt ?? new Date()).toISOString(),
    owner: config.owner,
    environment: config.environment,
    releaseVersion: config.releaseVersion,
    evidenceRef: config.evidenceRef,
    ok: blockers.length === 0,
    privateReadiness,
    scriptSummary: {
      required: requiredFinalAcceptanceScripts.length,
      missing: missingScripts,
    },
    docSummary: {
      required: requiredFinalAcceptanceDocs.length,
      missing: missingDocs,
    },
    blockers,
    warnings,
    sections: buildFinalAcceptanceSections(),
  };
}

export function formatFinalDeploymentAcceptance(report: FinalDeploymentAcceptance): string {
  const lines = [
    "# Lexos 最终部署验收报告",
    "",
    `生成时间：${report.generatedAt}`,
    `总体状态：${report.ok ? "可进入人工最终签收" : "存在阻断项"}`,
    `目标环境：${report.environment}`,
    `发布版本：${report.releaseVersion}`,
    `验收负责人：${report.owner}`,
    `证据归档：${report.evidenceRef}`,
    `必要脚本：${report.scriptSummary.missing.length ? "缺失" : "完整"}（必需 ${report.scriptSummary.required} 项）`,
    `必要文档：${report.docSummary.missing.length ? "缺失" : "完整"}（必需 ${report.docSummary.required} 项）`,
    "",
    formatIssueList("阻断项", report.blockers),
    formatIssueList("提示", report.warnings),
    "",
  ].filter((line) => line !== undefined);

  for (const section of report.sections) {
    lines.push(`## ${section.title}`);
    lines.push("");

    for (const item of section.items) {
      lines.push(`### ${item.title}`);
      lines.push(`- 性质：${item.required ? "必需" : "建议"}`);

      if (item.command) {
        lines.push(`- 命令：\`${item.command}\``);
      }

      lines.push(`- 留存证据：${item.evidence}`);
      item.notes.forEach((note) => lines.push(`- 说明：${note}`));
      lines.push("");
    }
  }

  return lines.join("\n").trimEnd();
}

function buildFinalAcceptanceSections(): FinalAcceptanceSection[] {
  return [
    {
      id: "release-baseline",
      title: "一、发布基线",
      items: [
        {
          id: "release-version",
          title: "版本与提交记录",
          required: true,
          evidence: "发布版本、Git commit、构建时间、部署环境和回滚目标版本已归档。",
          notes: ["不要在普通验收文档中记录密钥、数据库连接串或管理员密码。"],
        },
        {
          id: "environment-mode",
          title: "真实 Supabase 模式",
          required: true,
          command: "npm.cmd run private:check",
          evidence: "输出显示 `NEXT_PUBLIC_DEMO_MODE=false`、Supabase 必需变量完整且无 NEXT_PUBLIC 密钥暴露。",
          notes: ["该命令只检查变量名和本地文件完整性，不打印密钥值。"],
        },
      ],
    },
    {
      id: "quality-gates",
      title: "二、质量门槛",
      items: [
        {
          id: "typecheck",
          title: "类型检查",
          required: true,
          command: "npm.cmd run typecheck",
          evidence: "TypeScript 无类型错误。",
          notes: ["Windows 环境优先使用 npm.cmd。"],
        },
        {
          id: "unit-tests",
          title: "单元与领域测试",
          required: true,
          command: "npm.cmd test",
          evidence: "全部 Node test 用例通过。",
          notes: ["当前测试覆盖业务闭环、风控、备份、部署核对和运维交付规则。"],
        },
        {
          id: "build",
          title: "生产构建",
          required: true,
          command: "npm.cmd run build",
          evidence: "Next.js 生产构建成功，核心 API Route 被识别。",
          notes: ["如 Windows `Collecting build traces` 偶发超时，需单独复跑并归档最终成功输出。"],
        },
      ],
    },
    {
      id: "migration-security",
      title: "三、迁移与安全边界",
      items: [
        {
          id: "migration-state",
          title: "迁移应用状态",
          required: true,
          command: "npm.cmd run launch:check",
          evidence: `必需迁移已在目标环境应用或有 SQL Editor 执行记录：${requiredPrivateMigrationFiles.join(", ")}。`,
          notes: ["最终验收脚本不执行 `supabase db push`，迁移应用必须由负责人在维护窗口确认。"],
        },
        {
          id: "rls-direct-access",
          title: "RLS / Data API 直接访问验证",
          required: true,
          command: "npm.cmd run verify:rls",
          evidence: "service role 可读，anon 与 authenticated 不能直接读取内部 public 表。",
          notes: ["浏览器端业务访问继续统一走 Next.js API。"],
        },
      ],
    },
    {
      id: "storage-deliverables",
      title: "四、Storage 与交付附件",
      items: [
        {
          id: "storage-private-bucket",
          title: "私有交付附件 bucket",
          required: true,
          evidence: "`lexos-deliverables` 为私有 bucket，内部与客户下载均通过 Next.js API 签名链接。",
          notes: ["客户侧下载必须保留 token + 手机号 + 验证码校验，不接真实短信。"],
        },
        {
          id: "storage-backup-restore",
          title: "Storage 备份与恢复演练",
          required: true,
          command: "npm.cmd run backup:storage -- --dry-run",
          evidence: "Storage 备份计划、manifest 规则和恢复演练边界已归档。",
          notes: ["正式对象备份和恢复需在目标环境单独执行并留存 manifest。"],
        },
      ],
    },
    {
      id: "backup-recovery",
      title: "五、备份与恢复",
      items: [
        {
          id: "backup-plan",
          title: "调度安装、演练、加密、告警和异地镜像",
          required: true,
          command: "npm.cmd run backup:schedule && npm.cmd run backup:task:check && npm.cmd run backup:run:check",
          evidence: "调度计划、系统任务安装核对、运行证据、恢复演练报告、离线加密清单、失败告警清单和异地镜像清单均已归档。",
          notes: ["配套执行 `backup:rehearsal`、`backup:encrypt:check`、`backup:alert:check` 和 `backup:mirror:check`。"],
        },
        {
          id: "restore-boundary",
          title: "恢复边界确认",
          required: true,
          command: "npm.cmd run restore:db",
          evidence: "恢复脚本默认演练模式通过；真实恢复确认口令和目标库为空策略已由负责人签字确认。",
          notes: ["最终验收不自动执行真实恢复。"],
        },
      ],
    },
    {
      id: "operations-observability",
      title: "六、运维与可观测性",
      items: [
        {
          id: "ops-log",
          title: "运维日志",
          required: true,
          command: "npm.cmd run ops:log:check",
          evidence: "发布、迁移、备份、恢复、安全核对、真实 smoke 和异常处置记录口径已归档。",
          notes: ["运维日志不得记录 service role、数据库连接串或客户材料原文。"],
        },
        {
          id: "error-performance",
          title: "错误日志与性能监控",
          required: true,
          command: "npm.cmd run error:log:check",
          evidence: "错误分级、脱敏规则、性能指标、阈值和复核周期已归档。",
          notes: ["配套执行 `npm.cmd run perf:check`。"],
        },
      ],
    },
    {
      id: "tenant-boundary",
      title: "七、租户边界",
      items: [
        {
          id: "tenant-isolation",
          title: "多律所租户隔离核对",
          required: true,
          command: "npm.cmd run tenant:check",
          evidence: "租户表、关键 API 组织过滤、客户 token 组织来源和 Storage 路径隔离已核对。",
          notes: ["正式多律所部署前还需在验收库执行跨组织负向测试。"],
        },
      ],
    },
    {
      id: "business-smoke",
      title: "八、业务闭环验收",
      items: [
        {
          id: "real-smoke",
          title: "真实闭环 smoke",
          required: true,
          command: "npm.cmd run smoke:real",
          evidence: "配置管理员、主任、律师、客户确认、财务结算闭环成功，最终结算状态 confirmed。",
          notes: ["该命令会写入客户、任务、反馈和结算记录，只能在允许写入的验收库执行。"],
        },
        {
          id: "manual-pages",
          title: "核心页面人工验收",
          required: true,
          evidence: "管理员登录、用户、客户、任务、客户大屏、结算、资金、审计、风控、权限、参数页面均可访问。",
          notes: ["本轮不开发真实短信、证据矩阵、AI 辅助、新手保护期或新兵引流池。"],
        },
      ],
    },
    {
      id: "handover",
      title: "九、交付签收",
      items: [
        {
          id: "handover-package",
          title: "最终交付包",
          required: true,
          evidence: "验收报告、部署文档、备份恢复文档、运维联系人、回滚方案和剩余风险已交付。",
          notes: ["签收前确认默认管理员密码已变更，且所有临时 smoke 账号处理方式已记录。"],
        },
        {
          id: "post-deployment-verification",
          title: "部署后回归核对",
          required: true,
          command: "npm.cmd run postdeploy:check",
          evidence: "上线后健康检查、核心页面、RLS、客户附件、审计导出、备份恢复、日志性能、回滚窗口和观察期清单已归档。",
          notes: ["该命令只生成核对清单，不连接线上 Supabase、不运行真实 smoke、不写入业务数据。"],
        },
      ],
    },
  ];
}

function formatIssueList(title: string, issues: string[]): string | undefined {
  if (!issues.length) {
    return undefined;
  }

  return [
    `${title}：`,
    ...issues.map((issue) => `- ${issue}`),
  ].join("\n");
}
