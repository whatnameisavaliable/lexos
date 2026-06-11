export const BACKUP_RUN_EVIDENCE_KIND = "lexos-backup-run-evidence-check";

export type BackupRunEvidenceCheck = {
  version: 1;
  app: "lexos";
  kind: typeof BACKUP_RUN_EVIDENCE_KIND;
  generatedAt: string;
  owner: string;
  lastSuccessAt: string;
  maxAgeHours: number;
  taskExportRef: string;
  logRef: string;
  rehearsalRef: string;
  ageHours?: number;
  ok: boolean;
  blockers: string[];
  warnings: string[];
  evidenceItems: BackupRunEvidenceItem[];
};

export type BackupRunEvidenceItem = {
  id: string;
  title: string;
  required: boolean;
  expectedEvidence: string[];
};

const defaultOwner = "未指定";
const defaultRef = "未指定";
const defaultMaxAgeHours = 48;
const minimumMaxAgeHours = 12;
const secretLikePattern = /(?:service_role|database_url|db_url|password|secret|token|private_key|access_key|credential|短信|sms)/i;

export function getBackupRunEvidenceConfigFromEnv(env: NodeJS.ProcessEnv = process.env): {
  lastSuccessAt: string;
  logRef: string;
  maxAgeHours: number;
  owner: string;
  rehearsalRef: string;
  taskExportRef: string;
} {
  return {
    lastSuccessAt: env.LEXOS_BACKUP_RUN_LAST_SUCCESS_AT || defaultRef,
    logRef: env.LEXOS_BACKUP_RUN_LOG_REF || defaultRef,
    maxAgeHours: parsePositiveInteger(env.LEXOS_BACKUP_RUN_MAX_AGE_HOURS, defaultMaxAgeHours),
    owner: env.LEXOS_BACKUP_RUN_OWNER || defaultOwner,
    rehearsalRef: env.LEXOS_BACKUP_RUN_REHEARSAL_REF || defaultRef,
    taskExportRef: env.LEXOS_BACKUP_RUN_TASK_EXPORT_REF || defaultRef,
  };
}

export function buildBackupRunEvidenceCheck(options: {
  generatedAt?: Date;
  lastSuccessAt?: string;
  logRef?: string;
  maxAgeHours?: number;
  owner?: string;
  rehearsalRef?: string;
  taskExportRef?: string;
} = {}): BackupRunEvidenceCheck {
  const generatedAt = options.generatedAt ?? new Date();
  const owner = options.owner?.trim() || defaultOwner;
  const lastSuccessAt = options.lastSuccessAt?.trim() || defaultRef;
  const taskExportRef = options.taskExportRef?.trim() || defaultRef;
  const logRef = options.logRef?.trim() || defaultRef;
  const rehearsalRef = options.rehearsalRef?.trim() || defaultRef;
  const maxAgeHours = options.maxAgeHours ?? defaultMaxAgeHours;
  const blockers: string[] = [];
  const warnings: string[] = [
    "本检查只核对备份运行证据引用，不读取日志原文、不上传证据、不执行备份、不连接线上 Supabase。",
    "证据引用应使用工单号、归档编号、截图编号或受控目录编号，不应填写密钥、连接串、token 或短信服务配置。",
  ];

  if (owner === defaultOwner) {
    blockers.push("备份运行证据核对必须指定责任人，请设置 LEXOS_BACKUP_RUN_OWNER。");
  }

  if (taskExportRef === defaultRef) {
    blockers.push("备份运行证据核对必须提供计划任务导出或截图引用，请设置 LEXOS_BACKUP_RUN_TASK_EXPORT_REF。");
  }

  if (logRef === defaultRef) {
    blockers.push("备份运行证据核对必须提供运维日志引用，请设置 LEXOS_BACKUP_RUN_LOG_REF。");
  }

  if (lastSuccessAt === defaultRef) {
    blockers.push("备份运行证据核对必须提供最近成功备份时间，请设置 LEXOS_BACKUP_RUN_LAST_SUCCESS_AT。");
  }

  if (maxAgeHours < minimumMaxAgeHours) {
    blockers.push(`最近成功备份最大间隔不能小于 ${minimumMaxAgeHours} 小时，避免日常备份窗口内误报。`);
  }

  const lastSuccessDate = parseIsoDate(lastSuccessAt);
  const ageHours = lastSuccessDate ? diffHours(generatedAt, lastSuccessDate) : undefined;

  if (lastSuccessAt !== defaultRef && !lastSuccessDate) {
    blockers.push("最近成功备份时间必须是可解析的 ISO 时间，例如 2026-06-10T02:30:00.000Z。");
  }

  if (typeof ageHours === "number" && ageHours > maxAgeHours) {
    blockers.push(`最近成功备份已经超过 ${maxAgeHours} 小时，请先补做备份或确认任务计划器运行状态。`);
  }

  if (typeof ageHours === "number" && ageHours < 0) {
    blockers.push("最近成功备份时间不能晚于当前核对时间。");
  }

  if ([owner, taskExportRef, logRef, rehearsalRef].some((value) => secretLikePattern.test(value))) {
    blockers.push("责任人或证据引用不能包含 token、secret、连接串、短信服务或密钥信息。");
  }

  if (rehearsalRef === defaultRef) {
    warnings.push("建议补充最近一次恢复演练报告引用 LEXOS_BACKUP_RUN_REHEARSAL_REF，便于上线后观察期复核。");
  }

  return {
    version: 1,
    app: "lexos",
    kind: BACKUP_RUN_EVIDENCE_KIND,
    generatedAt: generatedAt.toISOString(),
    owner,
    lastSuccessAt,
    maxAgeHours,
    taskExportRef,
    logRef,
    rehearsalRef,
    ageHours,
    ok: blockers.length === 0,
    blockers,
    warnings,
    evidenceItems: backupRunEvidenceItems,
  };
}

export function formatBackupRunEvidenceCheck(check: BackupRunEvidenceCheck): string {
  const lines = [
    `Lexos 备份任务运行证据核对：${check.ok ? "通过" : "未通过"}`,
    `生成时间：${check.generatedAt}`,
    `责任人：${check.owner}`,
    `最近成功备份时间：${check.lastSuccessAt}`,
    `最近成功距今：${typeof check.ageHours === "number" ? `${check.ageHours.toFixed(1)} 小时` : "未计算"}`,
    `最大允许间隔：${check.maxAgeHours} 小时`,
    `任务导出/截图引用：${check.taskExportRef}`,
    `运维日志引用：${check.logRef}`,
    `恢复演练引用：${check.rehearsalRef}`,
    formatIssues("阻断项", check.blockers),
    formatIssues("提示", check.warnings),
    "证据清单：",
    ...check.evidenceItems.flatMap((item) => [
      `- ${item.title}${item.required ? "（必需）" : "（建议）"}`,
      `  证据：${item.expectedEvidence.join("、")}`,
    ]),
  ];

  return lines.filter(Boolean).join("\n");
}

export const backupRunEvidenceItems: BackupRunEvidenceItem[] = [
  {
    id: "task-export",
    title: "系统计划任务导出或截图",
    required: true,
    expectedEvidence: ["任务名称", "运行账号", "调度时间", "命令摘要", "安装人/复核人"],
  },
  {
    id: "last-success",
    title: "最近成功备份记录",
    required: true,
    expectedEvidence: ["成功时间", "数据库 manifest", "Storage manifest", "退出码", "执行人或任务账号"],
  },
  {
    id: "operations-log",
    title: "运维日志记录",
    required: true,
    expectedEvidence: ["日志引用", "stdout/stderr 摘要", "失败处理路径", "最近成功时间"],
  },
  {
    id: "rehearsal-report",
    title: "恢复演练报告引用",
    required: false,
    expectedEvidence: ["演练 ID", "数据库备份目录", "Storage 备份目录", "文件缺失为 0"],
  },
];

function parseIsoDate(value: string): Date | undefined {
  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function diffHours(left: Date, right: Date): number {
  return (left.getTime() - right.getTime()) / 1000 / 60 / 60;
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
