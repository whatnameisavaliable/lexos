export type PerformanceMetricCategory =
  | "web-vitals"
  | "api-latency"
  | "database"
  | "storage"
  | "jobs"
  | "capacity";

export type PerformanceMetricRequirement = {
  category: PerformanceMetricCategory;
  title: string;
  target: string;
  warning: string;
  critical: string;
  evidence: string[];
};

export type PerformanceMonitoringReadiness = {
  app: "lexos";
  ok: boolean;
  generatedAt: string;
  owner: string;
  reviewIntervalDays: number;
  sampleRetentionDays: number;
  requirements: PerformanceMetricRequirement[];
  blockers: string[];
  warnings: string[];
};

const defaultReviewIntervalDays = 30;
const defaultSampleRetentionDays = 180;
const maximumReviewIntervalDays = 90;
const minimumSampleRetentionDays = 90;

export const performanceMetricRequirements: PerformanceMetricRequirement[] = [
  {
    category: "web-vitals",
    title: "前端核心体验",
    target: "登录页、总览页、任务页和客户大屏首屏可交互时间保持在可接受范围内",
    warning: "同一页面连续两次人工验收明显变慢，或客户大屏移动端加载超过 5 秒",
    critical: "客户大屏、登录页或结算页在验收环境不可用",
    evidence: ["浏览器人工验收记录", "Preview smoke 结果", "构建产物大小变化记录"],
  },
  {
    category: "api-latency",
    title: "核心 API 延迟",
    target: "登录、任务列表、结算列表、客户大屏和附件签名下载接口响应稳定",
    warning: "核心 API 多次超过 2 秒，或分页查询明显退化",
    critical: "核心 API 多次超过 5 秒或返回 5xx",
    evidence: ["server runtime log 摘要", "/api/health 结果", "真实 smoke 输出"],
  },
  {
    category: "database",
    title: "数据库查询与 RLS",
    target: "列表分页、搜索、排序和 RLS 验证稳定通过",
    warning: "分页查询出现超时、计数异常或手工 SQL 明显变慢",
    critical: "数据库连接失败、RLS 验证不通过或迁移后核心列表不可读",
    evidence: ["verify:rls 输出", "migration list 输出", "慢查询摘要"],
  },
  {
    category: "storage",
    title: "Storage 附件访问",
    target: "上传、内部签名下载、客户验证码授权下载和 Storage 备份稳定可用",
    warning: "单个附件下载偶发失败，或备份 manifest 对象数量异常",
    critical: "lexos-deliverables bucket 不可访问，或客户已验收附件无法下载",
    evidence: ["storage-manifest.json", "附件下载验收记录", "Storage 备份/恢复演练报告"],
  },
  {
    category: "jobs",
    title: "运维脚本耗时",
    target: "backup、rehearsal、private:check、launch:check、upgrade:check 在维护窗口内完成",
    warning: "任一运维脚本耗时超过历史基线 2 倍",
    critical: "备份、恢复演练或上线核对脚本无法完成",
    evidence: ["脚本输出摘要", "运维日志", "错误日志"],
  },
  {
    category: "capacity",
    title: "容量与增长",
    target: "客户、任务、审计日志、资金流水和附件数量增长可解释",
    warning: "审计日志、附件对象或备份体积单周异常增长",
    critical: "磁盘、对象存储或数据库容量接近平台限制并影响写入",
    evidence: ["备份 manifest", "审计报表", "运维容量复核记录"],
  },
];

export function buildPerformanceMonitoringReadiness(options: {
  env?: NodeJS.ProcessEnv;
  generatedAt?: Date;
} = {}): PerformanceMonitoringReadiness {
  const env = options.env ?? process.env;
  const owner = env.LEXOS_PERFORMANCE_OWNER || "未指定";
  const reviewIntervalDays = parsePositiveInteger(env.LEXOS_PERFORMANCE_REVIEW_INTERVAL_DAYS, defaultReviewIntervalDays);
  const sampleRetentionDays = parsePositiveInteger(env.LEXOS_PERFORMANCE_SAMPLE_RETENTION_DAYS, defaultSampleRetentionDays);
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (reviewIntervalDays > maximumReviewIntervalDays) {
    blockers.push(`性能复核周期最长 ${maximumReviewIntervalDays} 天，当前为 ${reviewIntervalDays} 天。`);
  }

  if (sampleRetentionDays < minimumSampleRetentionDays) {
    blockers.push(`性能样本保留期至少 ${minimumSampleRetentionDays} 天，当前为 ${sampleRetentionDays} 天。`);
  }

  if (owner === "未指定") {
    warnings.push("建议设置 LEXOS_PERFORMANCE_OWNER，明确性能监控责任人。");
  }

  warnings.push("本检查只生成性能指标和证据清单，不采集真实用户数据、不写入数据库、不接入外部 APM。");
  warnings.push("性能样本不得包含客户案件材料、附件正文、客户大屏 token 明文、手机号完整明文或密钥值。");

  return {
    app: "lexos",
    ok: blockers.length === 0,
    generatedAt: (options.generatedAt ?? new Date()).toISOString(),
    owner,
    reviewIntervalDays,
    sampleRetentionDays,
    requirements: performanceMetricRequirements,
    blockers,
    warnings,
  };
}

export function formatPerformanceMonitoringReadiness(readiness: PerformanceMonitoringReadiness): string {
  const lines = [
    "# Lexos 性能监控核对",
    "",
    `生成时间：${readiness.generatedAt}`,
    `总体状态：${readiness.ok ? "可进入性能监控交接" : "存在阻断项"}`,
    `责任人：${readiness.owner}`,
    `复核周期：${readiness.reviewIntervalDays} 天`,
    `样本保留期：${readiness.sampleRetentionDays} 天`,
    "",
    formatIssues("阻断项", readiness.blockers),
    formatIssues("提示", readiness.warnings),
    "",
    "## 核心指标",
    ...readiness.requirements.flatMap((item) => [
      "",
      `### ${item.title}`,
      `- 分类：${item.category}`,
      `- 目标：${item.target}`,
      `- 预警：${item.warning}`,
      `- 严重：${item.critical}`,
      `- 留存证据：${item.evidence.join("、")}`,
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

function formatIssues(title: string, issues: string[]): string | undefined {
  if (!issues.length) {
    return undefined;
  }

  return [
    `${title}：`,
    ...issues.map((issue) => `- ${issue}`),
  ].join("\n");
}
