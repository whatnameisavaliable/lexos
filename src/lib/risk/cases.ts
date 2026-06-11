export type RiskCaseSource = "customer_complaint" | "low_score" | "manual";
export type RiskCaseSeverity = "low" | "medium" | "high" | "critical";
export type RiskCaseStatus = "open" | "in_review" | "resolved";
export type RiskCaseAction = "start_review" | "resolve" | "reopen";

export type RiskCaseDraftInput = {
  customerId?: unknown;
  description?: unknown;
  ownerUserId?: unknown;
  severity?: unknown;
  source?: unknown;
  status?: unknown;
  taskId?: unknown;
  title?: unknown;
};

export type RiskCaseDraft = {
  customerId?: string;
  description?: string;
  ownerUserId?: string;
  severity: RiskCaseSeverity;
  source: RiskCaseSource;
  status: RiskCaseStatus;
  taskId?: string;
  title: string;
};

export type RiskCaseStatusUpdateInput = {
  action?: unknown;
  resolutionNote?: unknown;
};

export type RiskCaseStatusUpdate = {
  action: RiskCaseAction;
  nextStatus: RiskCaseStatus;
  resolutionNote?: string;
};

export const LOW_SCORE_RISK_THRESHOLD = 6;

export const riskCaseSourceLabels: Record<RiskCaseSource, string> = {
  customer_complaint: "客户投诉",
  low_score: "低分触发",
  manual: "人工登记",
};

export const riskCaseSeverityLabels: Record<RiskCaseSeverity, string> = {
  low: "一级关注",
  medium: "二级一般",
  high: "三级严重",
  critical: "四级重大",
};

export const riskCaseStatusLabels: Record<RiskCaseStatus, string> = {
  in_review: "处理中",
  open: "待处理",
  resolved: "已处理",
};

export const riskCaseActionLabels: Record<RiskCaseAction, string> = {
  reopen: "重新打开",
  resolve: "办结",
  start_review: "开始处理",
};

const riskCaseSources = new Set<RiskCaseSource>(["customer_complaint", "low_score", "manual"]);
const riskCaseSeverities = new Set<RiskCaseSeverity>(["low", "medium", "high", "critical"]);
const riskCaseStatuses = new Set<RiskCaseStatus>(["open", "in_review", "resolved"]);
const riskCaseActions = new Set<RiskCaseAction>(["start_review", "resolve", "reopen"]);

const riskCaseTransitions: Record<RiskCaseStatus, Partial<Record<RiskCaseAction, RiskCaseStatus>>> = {
  in_review: {
    resolve: "resolved",
  },
  open: {
    resolve: "resolved",
    start_review: "in_review",
  },
  resolved: {
    reopen: "in_review",
  },
};

export function normalizeRiskCaseInput(input: RiskCaseDraftInput): RiskCaseDraft {
  const title = requiredText(input.title, "风控标题", 120);

  return {
    customerId: optionalText(input.customerId, 80),
    description: optionalText(input.description, 1200),
    ownerUserId: optionalText(input.ownerUserId, 80),
    severity: normalizeSeverity(input.severity),
    source: normalizeSource(input.source),
    status: normalizeStatus(input.status),
    taskId: optionalText(input.taskId, 80),
    title,
  };
}

export function shouldCreateLowScoreRiskCase(score: unknown, threshold = LOW_SCORE_RISK_THRESHOLD): boolean {
  const parsed = Number(score);

  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 10 && parsed <= threshold;
}

export function normalizeRiskCaseStatusUpdate(
  input: RiskCaseStatusUpdateInput,
  currentStatus: RiskCaseStatus,
): RiskCaseStatusUpdate {
  const action = normalizeAction(input.action);
  const nextStatus = transitionRiskCaseStatus(currentStatus, action);
  const resolutionNote = optionalText(input.resolutionNote, 1200);

  if (action === "resolve" && !resolutionNote) {
    throw new Error("办结风控工单时必须填写处理意见");
  }

  return {
    action,
    nextStatus,
    resolutionNote,
  };
}

export function transitionRiskCaseStatus(currentStatus: RiskCaseStatus, action: RiskCaseAction): RiskCaseStatus {
  const nextStatus = riskCaseTransitions[currentStatus]?.[action];

  if (!nextStatus) {
    throw new Error(`当前状态不能执行“${riskCaseActionLabels[action]}”`);
  }

  return nextStatus;
}

export function severityFromScore(score: unknown): RiskCaseSeverity {
  const parsed = Number(score);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 10) {
    return "medium";
  }

  if (parsed <= 2) {
    return "critical";
  }

  if (parsed <= 4) {
    return "high";
  }

  if (parsed <= LOW_SCORE_RISK_THRESHOLD) {
    return "medium";
  }

  return "low";
}

export function buildLowScoreRiskCaseDraft(input: {
  comment?: string;
  score: number;
  scoreLabel: string;
  taskTitle?: string;
}): RiskCaseDraft {
  const taskTitle = input.taskTitle?.trim();
  const title = taskTitle
    ? `${input.scoreLabel} ${input.score} 分：${taskTitle}`
    : `${input.scoreLabel} ${input.score} 分`;

  return {
    description: input.comment?.trim() || `${input.scoreLabel}低于 ${LOW_SCORE_RISK_THRESHOLD} 分阈值，建议进入风控跟进。`,
    severity: severityFromScore(input.score),
    source: "low_score",
    status: "open",
    title: title.slice(0, 120),
  };
}

function normalizeSource(value: unknown): RiskCaseSource {
  return typeof value === "string" && riskCaseSources.has(value as RiskCaseSource) ? (value as RiskCaseSource) : "manual";
}

function normalizeSeverity(value: unknown): RiskCaseSeverity {
  return typeof value === "string" && riskCaseSeverities.has(value as RiskCaseSeverity)
    ? (value as RiskCaseSeverity)
    : "medium";
}

function normalizeStatus(value: unknown): RiskCaseStatus {
  return typeof value === "string" && riskCaseStatuses.has(value as RiskCaseStatus) ? (value as RiskCaseStatus) : "open";
}

function normalizeAction(value: unknown): RiskCaseAction {
  if (typeof value === "string" && riskCaseActions.has(value as RiskCaseAction)) {
    return value as RiskCaseAction;
  }

  throw new Error("风控处理动作不正确");
}

function requiredText(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label}不能为空`);
  }

  return value.trim().slice(0, maxLength);
}

function optionalText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const text = value.trim();

  return text ? text.slice(0, maxLength) : undefined;
}
