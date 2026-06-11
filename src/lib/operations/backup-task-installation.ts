import {
  buildBackupSchedulePlan,
  getBackupOperationsConfigFromEnv,
  type BackupSchedulePlan,
} from "./backup-operations.ts";

export const BACKUP_TASK_INSTALLATION_KIND = "lexos-backup-task-installation-plan";

export type BackupTaskInstallationPlatform = "windows" | "linux" | "both";

export type BackupTaskInstallationStep = {
  id: string;
  title: string;
  ownerRole: string;
  expectedEvidence: string[];
};

export type BackupTaskInstallationPlan = {
  version: 1;
  app: "lexos";
  kind: typeof BACKUP_TASK_INSTALLATION_KIND;
  generatedAt: string;
  owner: string;
  runAsAccount: string;
  platform: BackupTaskInstallationPlatform;
  projectRoot: string;
  logDir: string;
  schedule: BackupSchedulePlan;
  steps: BackupTaskInstallationStep[];
  blockers: string[];
  warnings: string[];
};

const defaultOwner = "未指定";
const defaultRunAsAccount = "未指定";
const defaultPlatform: BackupTaskInstallationPlatform = "both";
const defaultLogDir = "ops-logs/backups";
const allowedPlatforms = new Set<BackupTaskInstallationPlatform>(["windows", "linux", "both"]);
const publicOrSourcePathPattern = /^(?:public|app|src|\.next)(?:[\\/]|$)/i;
const secretLikePattern = /(?:service_role|database_url|db_url|password|secret|token|private_key|access_key|credential|短信|sms)/i;

export function getBackupTaskInstallationConfigFromEnv(env: NodeJS.ProcessEnv = process.env): {
  logDir: string;
  owner: string;
  platform: BackupTaskInstallationPlatform;
  runAsAccount: string;
} {
  return {
    logDir: env.LEXOS_BACKUP_TASK_LOG_DIR || defaultLogDir,
    owner: env.LEXOS_BACKUP_TASK_OWNER || defaultOwner,
    platform: parseBackupTaskInstallationPlatform(env.LEXOS_BACKUP_TASK_PLATFORM),
    runAsAccount: env.LEXOS_BACKUP_TASK_RUN_AS || defaultRunAsAccount,
  };
}

export function parseBackupTaskInstallationPlatform(value?: string): BackupTaskInstallationPlatform {
  const normalized = value?.trim().toLowerCase();

  return allowedPlatforms.has(normalized as BackupTaskInstallationPlatform)
    ? normalized as BackupTaskInstallationPlatform
    : defaultPlatform;
}

export function buildBackupTaskInstallationPlan(options: {
  generatedAt?: Date;
  logDir?: string;
  owner?: string;
  platform?: BackupTaskInstallationPlatform;
  projectRoot?: string;
  runAsAccount?: string;
  schedule?: BackupSchedulePlan;
} = {}): BackupTaskInstallationPlan {
  const backupConfig = getBackupOperationsConfigFromEnv();
  const projectRoot = options.projectRoot ?? process.cwd();
  const schedule = options.schedule ?? buildBackupSchedulePlan({
    backupRoot: backupConfig.backupRoot,
    dailyTime: backupConfig.dailyTime,
    projectRoot,
    rehearsalIntervalDays: backupConfig.rehearsalIntervalDays,
    reportDir: backupConfig.reportDir,
    retentionDays: backupConfig.retentionDays,
    timezone: backupConfig.timezone,
  });
  const owner = options.owner?.trim() || defaultOwner;
  const runAsAccount = options.runAsAccount?.trim() || defaultRunAsAccount;
  const logDir = normalizeRelativePath(options.logDir?.trim() || defaultLogDir);
  const blockers = [...schedule.blockers];
  const warnings = [
    "本检查只生成系统任务安装核对清单，不会调用 schtasks、crontab、systemctl 或写入系统任务。",
    "正式安装应由律所运维在受控账号下执行，并把标准输出、错误输出、退出码和最近成功时间写入运维日志。",
  ];

  if (owner === defaultOwner) {
    blockers.push("备份系统任务安装核对必须指定责任人，请设置 LEXOS_BACKUP_TASK_OWNER。");
  }

  if (runAsAccount === defaultRunAsAccount) {
    blockers.push("备份系统任务安装核对必须指定运行账号，请设置 LEXOS_BACKUP_TASK_RUN_AS。");
  }

  if (secretLikePattern.test(owner) || secretLikePattern.test(runAsAccount) || secretLikePattern.test(logDir)) {
    blockers.push("责任人、运行账号或日志目录不能包含 token、secret、连接串、短信服务或密钥信息。");
  }

  if (pathMayBePublicOrSource(logDir)) {
    blockers.push("备份任务日志目录不能位于 public、app、src 或 .next 等源码/发布目录。");
  }

  return {
    version: 1,
    app: "lexos",
    kind: BACKUP_TASK_INSTALLATION_KIND,
    generatedAt: (options.generatedAt ?? new Date()).toISOString(),
    owner,
    runAsAccount,
    platform: options.platform ?? defaultPlatform,
    projectRoot,
    logDir,
    schedule,
    steps: buildInstallationSteps(options.platform ?? defaultPlatform),
    blockers,
    warnings,
  };
}

export function formatBackupTaskInstallationPlan(plan: BackupTaskInstallationPlan): string {
  const lines = [
    `Lexos 备份系统任务安装核对：${plan.blockers.length ? "未通过" : "可进入人工安装"}`,
    `生成时间：${plan.generatedAt}`,
    `责任人：${plan.owner}`,
    `运行账号：${plan.runAsAccount}`,
    `目标平台：${formatPlatform(plan.platform)}`,
    `项目目录：${plan.projectRoot}`,
    `日志目录：${plan.logDir}`,
    `每日备份时间：${plan.schedule.dailyTime.value}（${plan.schedule.timezone}）`,
    formatIssues("阻断项", plan.blockers),
    formatIssues("提示", plan.warnings),
    "安装前核对：",
    ...plan.steps.flatMap((step) => [
      `- ${step.title}（${step.ownerRole}）`,
      `  证据：${step.expectedEvidence.join("、")}`,
    ]),
    "Windows Task Scheduler 参考命令：",
    `- ${plan.schedule.windowsTaskScheduler.dailyBackup}`,
    `- ${plan.schedule.windowsTaskScheduler.weeklyRehearsal}`,
    "Linux cron 参考条目：",
    `- ${plan.schedule.cronEntries.dailyBackup}`,
    `- ${plan.schedule.cronEntries.weeklyRehearsal}`,
  ];

  return lines.filter(Boolean).join("\n");
}

function buildInstallationSteps(platform: BackupTaskInstallationPlatform): BackupTaskInstallationStep[] {
  const steps: BackupTaskInstallationStep[] = [
    {
      id: "account",
      title: "确认运行账号权限最小化",
      ownerRole: "运维负责人",
      expectedEvidence: ["运行账号", "项目目录读写权限", "备份目录读写权限", "环境变量读取方式"],
    },
    {
      id: "environment",
      title: "确认环境变量与密钥不进入命令行明文",
      ownerRole: "安全复核人",
      expectedEvidence: [".env.local 权限", "密钥保管人", "service role 不写入计划任务命令"],
    },
    {
      id: "logs",
      title: "确认日志目录与失败留痕",
      ownerRole: "运维负责人",
      expectedEvidence: ["日志目录", "stdout/stderr 保存策略", "退出码记录", "最近成功备份时间"],
    },
    {
      id: "manual-install",
      title: `按 ${formatPlatform(platform)} 受控安装计划任务`,
      ownerRole: "运维负责人",
      expectedEvidence: ["安装命令", "任务名称", "调度时间", "安装人", "复核人"],
    },
    {
      id: "post-install",
      title: "安装后执行演练与告警核对",
      ownerRole: "交付负责人",
      expectedEvidence: ["backup:rehearsal 输出", "backup:alert:check 输出", "ops:log:check 记录口径"],
    },
  ];

  return steps;
}

function normalizeRelativePath(value: string): string {
  return value.replaceAll("\\", "/").replace(/^\.\/+/, "");
}

function pathMayBePublicOrSource(value: string): boolean {
  return publicOrSourcePathPattern.test(normalizeRelativePath(value));
}

function formatPlatform(platform: BackupTaskInstallationPlatform): string {
  if (platform === "windows") {
    return "Windows Task Scheduler";
  }

  if (platform === "linux") {
    return "Linux cron";
  }

  return "Windows Task Scheduler / Linux cron";
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
