export type OperationsLogEventType =
  | "deployment"
  | "migration"
  | "backup"
  | "restore"
  | "security"
  | "smoke"
  | "incident"
  | "access-change";

export type OperationsLogRequirement = {
  eventType: OperationsLogEventType;
  title: string;
  requiredFields: string[];
  evidence: string[];
  forbiddenFields: string[];
};

export type OperationsLogReadiness = {
  app: "lexos";
  ok: boolean;
  generatedAt: string;
  logDir: string;
  owner: string;
  retentionDays: number;
  reviewIntervalDays: number;
  requirements: OperationsLogRequirement[];
  blockers: string[];
  warnings: string[];
};

const defaultLogDir = "ops-logs";
const defaultRetentionDays = 365;
const defaultReviewIntervalDays = 30;
const minimumRetentionDays = 180;
const maximumReviewIntervalDays = 90;

export const operationsLogRequirements: OperationsLogRequirement[] = [
  {
    eventType: "deployment",
    title: "应用发布与回滚",
    requiredFields: ["时间", "版本/commit", "环境", "执行人", "结果", "回滚方案"],
    evidence: ["构建输出", "部署平台记录", "发布审批记录"],
    forbiddenFields: ["密钥值", "数据库连接串", "客户资料明细"],
  },
  {
    eventType: "migration",
    title: "数据库迁移",
    requiredFields: ["时间", "迁移文件", "目标环境", "执行人", "执行结果"],
    evidence: ["supabase migration list 输出", "SQL Editor 执行记录", "升级核对计划"],
    forbiddenFields: ["service role key", "数据库密码", "完整连接串"],
  },
  {
    eventType: "backup",
    title: "数据库与 Storage 备份",
    requiredFields: ["时间", "备份类型", "备份目录", "对象数量/文件清单", "责任人", "校验结果"],
    evidence: ["manifest.json", "storage-manifest.json", "backup:schedule 输出", "backup:task:check 输出", "backup:run:check 输出"],
    forbiddenFields: ["客户文件原文", "未打码数据库连接串", "密钥值"],
  },
  {
    eventType: "restore",
    title: "恢复演练与真实恢复",
    requiredFields: ["时间", "恢复来源", "目标环境", "执行人", "确认口令已核验", "验证结果"],
    evidence: ["backup:rehearsal 报告", "恢复审批记录", "RLS/smoke 结果"],
    forbiddenFields: ["恢复确认口令", "数据库密码", "客户敏感正文"],
  },
  {
    eventType: "security",
    title: "安全边界核对",
    requiredFields: ["时间", "核对范围", "执行人", "结果", "遗留风险"],
    evidence: ["private:check 输出", "launch:check 输出", "verify:rls 输出"],
    forbiddenFields: ["真实 key", "用户密码", "客户确认页 token 明文"],
  },
  {
    eventType: "smoke",
    title: "真实闭环 smoke",
    requiredFields: ["时间", "环境", "执行人", "最终状态", "测试数据处理口径"],
    evidence: ["smoke:real 输出摘要", "验收库记录 ID", "测试数据清理/保留说明"],
    forbiddenFields: ["客户手机号完整明文", "客户确认页 token 明文", "用户密码"],
  },
  {
    eventType: "incident",
    title: "生产异常与处置",
    requiredFields: ["时间", "影响范围", "发现人", "处理人", "处置动作", "复盘结论"],
    evidence: ["错误日志摘要", "审计报表", "处理工单"],
    forbiddenFields: ["客户案件材料原文", "密钥值", "未脱敏个人信息"],
  },
  {
    eventType: "access-change",
    title: "运维访问权限变更",
    requiredFields: ["时间", "账号/角色", "变更原因", "审批人", "执行人", "复核时间"],
    evidence: ["账号变更记录", "审批记录", "复核清单"],
    forbiddenFields: ["初始密码", "临时密码", "私钥内容"],
  },
];

export function buildOperationsLogReadiness(options: {
  env?: NodeJS.ProcessEnv;
  generatedAt?: Date;
} = {}): OperationsLogReadiness {
  const env = options.env ?? process.env;
  const logDir = env.LEXOS_OPERATIONS_LOG_DIR || defaultLogDir;
  const owner = env.LEXOS_OPERATIONS_LOG_OWNER || "未指定";
  const retentionDays = parsePositiveInteger(env.LEXOS_OPERATIONS_LOG_RETENTION_DAYS, defaultRetentionDays);
  const reviewIntervalDays = parsePositiveInteger(env.LEXOS_OPERATIONS_LOG_REVIEW_INTERVAL_DAYS, defaultReviewIntervalDays);
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (retentionDays < minimumRetentionDays) {
    blockers.push(`运维日志保留期至少 ${minimumRetentionDays} 天，当前为 ${retentionDays} 天。`);
  }

  if (reviewIntervalDays > maximumReviewIntervalDays) {
    blockers.push(`运维日志复核周期最长 ${maximumReviewIntervalDays} 天，当前为 ${reviewIntervalDays} 天。`);
  }

  if (owner === "未指定") {
    warnings.push("建议设置 LEXOS_OPERATIONS_LOG_OWNER，明确运维日志责任人。");
  }

  if (isPublicLogDir(logDir)) {
    warnings.push("运维日志目录不应位于 public、app 或可被静态托管的目录下。");
  }

  warnings.push("本检查只生成运维日志制度和证据清单，不会创建目录、写入日志或上传到外部日志平台。");
  warnings.push("运维日志不得记录密钥值、数据库连接串、用户密码、客户确认页 token 明文或客户案件材料原文。");

  return {
    app: "lexos",
    ok: blockers.length === 0,
    generatedAt: (options.generatedAt ?? new Date()).toISOString(),
    logDir,
    owner,
    retentionDays,
    reviewIntervalDays,
    requirements: operationsLogRequirements,
    blockers,
    warnings,
  };
}

export function formatOperationsLogReadiness(readiness: OperationsLogReadiness): string {
  const lines = [
    "# Lexos 运维日志核对",
    "",
    `生成时间：${readiness.generatedAt}`,
    `总体状态：${readiness.ok ? "可进入运维交接" : "存在阻断项"}`,
    `日志目录建议：${readiness.logDir}`,
    `责任人：${readiness.owner}`,
    `保留期：${readiness.retentionDays} 天`,
    `复核周期：${readiness.reviewIntervalDays} 天`,
    "",
    formatIssues("阻断项", readiness.blockers),
    formatIssues("提示", readiness.warnings),
    "",
    "## 必记事件",
    ...readiness.requirements.flatMap((item) => [
      "",
      `### ${item.title}`,
      `- 类型：${item.eventType}`,
      `- 必填字段：${item.requiredFields.join("、")}`,
      `- 留存证据：${item.evidence.join("、")}`,
      `- 禁止记录：${item.forbiddenFields.join("、")}`,
    ]),
  ].filter((line) => line !== undefined);

  return lines.join("\n").trimEnd();
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function isPublicLogDir(logDir: string): boolean {
  const normalized = logDir.replaceAll("\\", "/").toLowerCase();

  return normalized === "public"
    || normalized.startsWith("public/")
    || normalized === "app"
    || normalized.startsWith("app/");
}

function formatIssues(title: string, issues: string[]): string | undefined {
  if (!issues.length) {
    return undefined;
  }

  return [
    `${title}：`,
    ...issues.map((issue) => `- ${issue}`),
  ].join("\n");
}
