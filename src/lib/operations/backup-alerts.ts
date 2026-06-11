export const BACKUP_ALERT_PLAN_KIND = "lexos-backup-alert-plan";

export type BackupAlertChannel = "operations-log" | "email-manual" | "webhook-manual" | "duty-phone-manual";

export type BackupAlertRule = {
  id: string;
  title: string;
  severity: "critical" | "error" | "warning";
  trigger: string;
  requiredEvidence: string[];
  immediateActions: string[];
};

export type BackupAlertPlan = {
  version: 1;
  app: "lexos";
  kind: typeof BACKUP_ALERT_PLAN_KIND;
  generatedAt: string;
  owner: string;
  channels: BackupAlertChannel[];
  maxSilenceHours: number;
  escalationHours: number;
  rules: BackupAlertRule[];
  blockers: string[];
  warnings: string[];
};

const defaultOwner = "未指定";
const defaultChannels: BackupAlertChannel[] = ["operations-log"];
const allowedChannels = new Set<BackupAlertChannel>([
  "operations-log",
  "email-manual",
  "webhook-manual",
  "duty-phone-manual",
]);
const minimumMaxSilenceHours = 12;
const maximumEscalationHours = 24;
const secretLikePattern = /(?:service_role|database_url|db_url|password|secret|token|private_key|短信|sms)/i;

export const backupAlertRules: BackupAlertRule[] = [
  {
    id: "database-backup-failed",
    title: "数据库备份失败",
    severity: "critical",
    trigger: "`backup:db` 退出码非 0、未生成 manifest.json，或备份目录缺少 schema.sql/data.sql。",
    requiredEvidence: ["脚本名称", "退出码", "备份目录", "错误摘要", "最近成功备份时间"],
    immediateActions: ["保留脚本输出摘要", "确认数据库连接串未泄露", "在维护窗口内补做数据库备份"],
  },
  {
    id: "storage-backup-failed",
    title: "Storage 对象备份失败",
    severity: "critical",
    trigger: "`backup:storage` 退出码非 0、未生成 storage-manifest.json，或对象文件缺失。",
    requiredEvidence: ["bucket", "对象数量", "缺失对象摘要", "错误摘要", "最近成功备份时间"],
    immediateActions: ["核对 service role 配置", "确认 bucket 私有性", "补做 Storage 对象备份"],
  },
  {
    id: "rehearsal-failed",
    title: "恢复演练报告未通过",
    severity: "error",
    trigger: "`backup:rehearsal` 输出阻断项，或数据库/Storage 备份时间窗口不一致。",
    requiredEvidence: ["演练 ID", "阻断项", "数据库备份目录", "Storage 备份目录", "处理人"],
    immediateActions: ["补齐缺失文件", "重新生成演练报告", "必要时暂停升级或上线窗口"],
  },
  {
    id: "encrypted-copy-missing",
    title: "离线加密副本缺失",
    severity: "error",
    trigger: "`backup:encrypt:check` 未通过，或加密副本数量、异地副本、密钥标识未完成交接。",
    requiredEvidence: ["加密方式", "密钥标识", "副本位置", "校验值", "复核人"],
    immediateActions: ["补齐离线加密副本", "复核密钥保管记录", "更新运维日志"],
  },
  {
    id: "backup-silence-timeout",
    title: "备份静默超时",
    severity: "warning",
    trigger: "超过设定静默阈值仍无成功备份、演练或加密交接记录。",
    requiredEvidence: ["最近成功事件", "静默时长", "责任人", "排查结论"],
    immediateActions: ["确认任务计划器是否运行", "检查运维日志和错误日志", "安排人工补跑"],
  },
];

export function getBackupAlertConfigFromEnv(env: NodeJS.ProcessEnv = process.env): {
  channels: BackupAlertChannel[];
  escalationHours: number;
  maxSilenceHours: number;
  owner: string;
} {
  return {
    channels: parseBackupAlertChannels(env.LEXOS_BACKUP_ALERT_CHANNELS),
    escalationHours: parsePositiveInteger(env.LEXOS_BACKUP_ALERT_ESCALATION_HOURS, 4),
    maxSilenceHours: parsePositiveInteger(env.LEXOS_BACKUP_ALERT_MAX_SILENCE_HOURS, 24),
    owner: env.LEXOS_BACKUP_ALERT_OWNER || defaultOwner,
  };
}

export function parseBackupAlertChannels(value?: string): BackupAlertChannel[] {
  if (!value) {
    return [...defaultChannels];
  }

  const channels = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item): item is BackupAlertChannel => allowedChannels.has(item as BackupAlertChannel));

  return channels.length ? Array.from(new Set(channels)) : [...defaultChannels];
}

export function buildBackupAlertPlan(options: {
  channels?: BackupAlertChannel[];
  escalationHours?: number;
  generatedAt?: Date;
  maxSilenceHours?: number;
  owner?: string;
} = {}): BackupAlertPlan {
  const owner = options.owner?.trim() || defaultOwner;
  const channels = options.channels?.length ? Array.from(new Set(options.channels)) : [...defaultChannels];
  const maxSilenceHours = options.maxSilenceHours ?? 24;
  const escalationHours = options.escalationHours ?? 4;
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (owner === defaultOwner) {
    blockers.push("备份失败告警必须指定责任人，请设置 LEXOS_BACKUP_ALERT_OWNER。");
  }

  if (!channels.includes("operations-log")) {
    blockers.push("备份失败告警至少要写入运维日志渠道 operations-log。");
  }

  if (maxSilenceHours < minimumMaxSilenceHours) {
    blockers.push(`备份静默阈值不能小于 ${minimumMaxSilenceHours} 小时，避免正常每日备份窗口内误报。`);
  }

  if (escalationHours > maximumEscalationHours) {
    blockers.push(`严重备份失败升级时限不能超过 ${maximumEscalationHours} 小时。`);
  }

  if (channels.some((channel) => secretLikePattern.test(channel))) {
    blockers.push("告警渠道只能填写渠道代号，不能包含短信服务商、token、secret、数据库连接串或 service role。");
  }

  warnings.push("本检查只生成备份失败告警制度清单，不发送邮件、不发短信、不调用 webhook、不连接外部监控平台。");
  warnings.push("告警内容只记录摘要、退出码、目录和对象数量，不记录数据库连接串、service role、恢复确认口令或客户材料原文。");

  return {
    version: 1,
    app: "lexos",
    kind: BACKUP_ALERT_PLAN_KIND,
    generatedAt: (options.generatedAt ?? new Date()).toISOString(),
    owner,
    channels,
    maxSilenceHours,
    escalationHours,
    rules: backupAlertRules,
    blockers,
    warnings,
  };
}

export function formatBackupAlertPlan(plan: BackupAlertPlan): string {
  return [
    `Lexos 备份失败告警核对：${plan.blockers.length ? "未通过" : "可进入人工告警交接"}`,
    `生成时间：${plan.generatedAt}`,
    `责任人：${plan.owner}`,
    `告警渠道：${plan.channels.join(", ")}`,
    `备份静默阈值：${plan.maxSilenceHours} 小时`,
    `严重失败升级时限：${plan.escalationHours} 小时`,
    formatIssues("阻断项", plan.blockers),
    formatIssues("提示", plan.warnings),
    "告警规则：",
    ...plan.rules.flatMap((rule) => [
      `- ${rule.title}（${rule.severity}）：${rule.trigger}`,
      `  证据：${rule.requiredEvidence.join("、")}`,
      `  立即动作：${rule.immediateActions.join("、")}`,
    ]),
  ].filter(Boolean).join("\n");
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
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
