export type ErrorLogSeverity = "critical" | "error" | "warning" | "info";

export type ErrorLogCategory =
  | "runtime"
  | "api"
  | "database"
  | "storage"
  | "auth"
  | "job"
  | "integration";

export type ErrorLogRequirement = {
  category: ErrorLogCategory;
  title: string;
  severity: ErrorLogSeverity;
  requiredFields: string[];
  examples: string[];
  immediateActions: string[];
};

export type ErrorLogReadiness = {
  app: "lexos";
  ok: boolean;
  generatedAt: string;
  destination: string;
  retentionDays: number;
  alertCritical: boolean;
  requirements: ErrorLogRequirement[];
  blockers: string[];
  warnings: string[];
  redactionRules: string[];
};

const defaultDestination = "server-runtime-log";
const defaultRetentionDays = 180;
const minimumRetentionDays = 90;

const sensitiveKeyPattern = /(?:password|token|secret|service_role|database_url|db_url|connection|string|authorization|cookie|验证码|密码|密钥)/i;
const phonePattern = /1[3-9]\d{9}/g;

export const errorLogRequirements: ErrorLogRequirement[] = [
  {
    category: "runtime",
    title: "应用运行时异常",
    severity: "error",
    requiredFields: ["时间", "环境", "路由/模块", "错误摘要", "请求 ID", "影响范围"],
    examples: ["Next.js route handler 未捕获异常", "前端 API client 收到非预期响应"],
    immediateActions: ["确认是否影响登录、任务、结算和客户确认页", "保留构建版本和请求路径"],
  },
  {
    category: "api",
    title: "业务 API 异常",
    severity: "error",
    requiredFields: ["时间", "API 路径", "HTTP 状态", "当前角色", "业务对象 ID", "错误码/摘要"],
    examples: ["创建任务失败", "批量确认结算失败", "客户验证码校验失败率异常"],
    immediateActions: ["核对最近发布和系统参数", "必要时导出相关审计日志"],
  },
  {
    category: "database",
    title: "数据库与 RLS 异常",
    severity: "critical",
    requiredFields: ["时间", "操作类型", "表/迁移", "错误摘要", "执行人", "恢复动作"],
    examples: ["迁移执行失败", "RLS 验证未通过", "数据库连接失败"],
    immediateActions: ["暂停继续迁移", "确认备份可用", "复跑 private:check、upgrade:check 和 verify:rls"],
  },
  {
    category: "storage",
    title: "Storage 附件异常",
    severity: "error",
    requiredFields: ["时间", "bucket", "对象路径摘要", "操作类型", "错误摘要", "影响任务"],
    examples: ["附件上传失败", "签名下载链接生成失败", "Storage 备份缺失对象"],
    immediateActions: ["确认 bucket 私有性和 service role 配置", "核对 storage-manifest.json"],
  },
  {
    category: "auth",
    title: "认证与权限异常",
    severity: "warning",
    requiredFields: ["时间", "账号/角色摘要", "动作", "结果", "IP 摘要", "User-Agent 摘要"],
    examples: ["失败登录激增", "账号停用后仍尝试访问", "角色菜单权限不一致"],
    immediateActions: ["导出审计报表", "复核账号状态和角色权限矩阵"],
  },
  {
    category: "job",
    title: "运维脚本与定时任务异常",
    severity: "error",
    requiredFields: ["时间", "脚本名称", "参数摘要", "退出码", "错误摘要", "重试计划"],
    examples: ["backup:db 失败", "backup:rehearsal 报告不通过", "smoke:real 未完成闭环"],
    immediateActions: ["保留脚本输出摘要", "不得记录确认口令或数据库连接串", "确认是否需要人工补备份"],
  },
  {
    category: "integration",
    title: "外部平台与部署异常",
    severity: "warning",
    requiredFields: ["时间", "平台", "环境", "错误摘要", "影响范围", "负责人"],
    examples: ["Vercel Preview health check 不通过", "反向代理返回 502", "证书或域名异常"],
    immediateActions: ["核对部署环境变量", "访问 /api/health", "记录平台工单编号"],
  },
];

export function buildErrorLogReadiness(options: {
  env?: NodeJS.ProcessEnv;
  generatedAt?: Date;
} = {}): ErrorLogReadiness {
  const env = options.env ?? process.env;
  const destination = env.LEXOS_ERROR_LOG_DESTINATION || defaultDestination;
  const retentionDays = parsePositiveInteger(env.LEXOS_ERROR_LOG_RETENTION_DAYS, defaultRetentionDays);
  const alertCritical = env.LEXOS_ERROR_LOG_ALERT_CRITICAL !== "false";
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (retentionDays < minimumRetentionDays) {
    blockers.push(`错误日志保留期至少 ${minimumRetentionDays} 天，当前为 ${retentionDays} 天。`);
  }

  if (isPublicDestination(destination)) {
    blockers.push("错误日志目标不能位于 public、app 或静态托管目录。");
  }

  if (!alertCritical) {
    warnings.push("建议对 critical 级别错误设置人工告警或值班通知。");
  }

  warnings.push("本检查只生成错误日志分级和脱敏清单，不会写入日志、创建目录或接入外部监控平台。");
  warnings.push("错误日志不得记录密码、验证码、token 明文、service role key、数据库连接串、Cookie 或客户案件材料原文。");

  return {
    app: "lexos",
    ok: blockers.length === 0,
    generatedAt: (options.generatedAt ?? new Date()).toISOString(),
    destination,
    retentionDays,
    alertCritical,
    requirements: errorLogRequirements,
    blockers,
    warnings,
    redactionRules: [
      "按 key 名屏蔽 password、token、secret、service_role、database_url、authorization、cookie 等字段。",
      "手机号仅保留前三后四或使用摘要，不记录客户手机号完整明文。",
      "客户确认页 token、验证码、恢复确认口令和数据库连接串永不写入错误日志。",
      "客户案件材料、交付附件正文和律师成果正文只记录对象 ID 或文件摘要。",
    ],
  };
}

export function redactErrorLogMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(metadata).map(([key, value]) => [
    key,
    redactValue(key, value),
  ]));
}

export function formatErrorLogReadiness(readiness: ErrorLogReadiness): string {
  const lines = [
    "# Lexos 错误日志核对",
    "",
    `生成时间：${readiness.generatedAt}`,
    `总体状态：${readiness.ok ? "可进入错误日志交接" : "存在阻断项"}`,
    `日志目标：${readiness.destination}`,
    `保留期：${readiness.retentionDays} 天`,
    `Critical 告警：${readiness.alertCritical ? "建议开启" : "未开启"}`,
    "",
    formatIssues("阻断项", readiness.blockers),
    formatIssues("提示", readiness.warnings),
    "",
    "## 脱敏规则",
    ...readiness.redactionRules.map((rule) => `- ${rule}`),
    "",
    "## 错误分类",
    ...readiness.requirements.flatMap((item) => [
      "",
      `### ${item.title}`,
      `- 分类：${item.category}`,
      `- 默认级别：${item.severity}`,
      `- 必填字段：${item.requiredFields.join("、")}`,
      `- 示例：${item.examples.join("、")}`,
      `- 立即动作：${item.immediateActions.join("、")}`,
    ]),
  ].filter((line) => line !== undefined);

  return lines.join("\n").trimEnd();
}

function redactValue(key: string, value: unknown): unknown {
  if (sensitiveKeyPattern.test(key)) {
    return "[已脱敏]";
  }

  if (typeof value === "string") {
    return value.replace(phonePattern, (phone) => `${phone.slice(0, 3)}****${phone.slice(7)}`);
  }

  if (Array.isArray(value)) {
    return value.map((item) => typeof item === "object" && item !== null
      ? redactErrorLogMetadata(item as Record<string, unknown>)
      : item);
  }

  if (typeof value === "object" && value !== null) {
    return redactErrorLogMetadata(value as Record<string, unknown>);
  }

  return value;
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function isPublicDestination(destination: string): boolean {
  const normalized = destination.replaceAll("\\", "/").toLowerCase();

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
