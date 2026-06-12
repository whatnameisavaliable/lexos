"use client";

import type { ComponentType, FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ClipboardList,
  Download,
  FileText,
  Gavel,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Loader2,
  Paperclip,
  Plus,
  ReceiptText,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import {
  DEFAULT_INITIAL_PASSWORD,
  calculateSettlementAmount,
  isDirectorRole,
  isLawyerRole,
  isSystemConfigRole,
  createInitialUserProfile,
  transitionTaskStatus,
  type TaskStatus,
  type UserRole,
} from "@/lib/domain/core";
import { buildCustomerChannelStats, summarizeCustomerChannelStats } from "@/lib/analytics/customer-channels";
import { buildLawyerPerformanceStats, summarizeLawyerPerformanceStats } from "@/lib/analytics/lawyer-performance";
import { buildPersonalWorkbench, type PersonalWorkbenchSummary } from "@/lib/analytics/personal-workbench";
import { AUDIT_REPORT_MAX_ROWS, buildAuditReport } from "@/lib/audit/report";
import { MAX_DELIVERABLE_FILE_BYTES, formatFileSize } from "@/lib/deliverables/files";
import { verifyDemoPortalCode } from "@/lib/domain/portal";
import {
  buildFundSummary,
  createRiskDeductionFundTransaction,
  fundAccountLabel,
  fundTransactionTypeLabel,
  type FundSummaryItem,
} from "@/lib/funds/ledger";
import {
  canAccessMenu,
  getAccessibleMenuItems,
  getDefaultMenuKey,
  internalUserRoleOptions,
  menuPermissionItems,
  roleDescriptions,
  roleLabels,
  type MenuPermissionKey,
} from "@/lib/permissions/menu";
import { buildTaskDeliveryRecords, buildTaskMilestones, summarizeTaskMilestones, type TaskMilestone } from "@/lib/tasks/progress";
import { canReviewTask, isTaskReviewSatisfied, type TaskReviewDecision } from "@/lib/tasks/review";
import {
  buildCustomerAutoConfirmStatus,
  DEFAULT_CUSTOMER_AUTO_CONFIRM_DAYS,
} from "@/lib/tasks/customer-auto-confirm";
import {
  buildLowScoreRiskCaseDraft,
  normalizeRiskCaseStatusUpdate,
  riskCaseActionLabels,
  riskCaseSeverityLabels,
  riskCaseSourceLabels,
  riskCaseStatusLabels,
  shouldCreateLowScoreRiskCase,
  type RiskCaseAction,
} from "@/lib/risk/cases";
import {
  canSubmitCommitteeDecision,
  normalizeRiskCaseCommitteeDecisionInput,
  riskCaseCommitteeDecisionLabels,
  type RiskCaseCommitteeDecision,
} from "@/lib/risk/committee-decision";
import {
  buildRepeatDisciplineStats,
  REPEAT_DISCIPLINE_LOOKBACK_DAYS,
  repeatDisciplineLevelLabels,
  summarizeRepeatDisciplineStats,
  type RepeatDisciplineStat,
} from "@/lib/risk/repeat-discipline";
import {
  buildRiskDeductionRatesFromSettings,
  calculateRiskDeductionPreview,
  type RiskDeductionPreview,
  type RiskDeductionRates,
} from "@/lib/risk/deductions";
import {
  buildRiskCaseDefenseStatus,
  normalizeRiskCaseDefenseInput,
  type RiskCaseDefenseStatus,
} from "@/lib/risk/defense";
import {
  buildTaskRiskFreezeStatus,
  formatTaskRiskFreezeError,
  taskRiskFreezeStatusText,
  type TaskRiskFreezeStatus,
} from "@/lib/risk/task-freeze";
import {
  buildClaimRiskRestriction,
  canClaimTaskWithRestriction,
  type ClaimRiskRestriction,
} from "@/lib/tasks/claim-restrictions";
import {
  demoAuditLogs,
  demoCustomers,
  demoFeedback,
  demoFundTransactions,
  demoRanks,
  demoRiskCases,
  demoSettlements,
  demoTasks,
  demoUsers,
} from "@/lib/demo-data";
import { formatBasisPoints, formatMoney, nowText } from "@/lib/format";
import {
  buildSystemSettingsFromRows,
  type SystemSettingItem,
  type SystemSettingValue,
} from "@/lib/settings/definitions";
import { buildSettlementRiskLockStatus } from "@/lib/settings/runtime";
import { settlementsToCsv } from "@/lib/settlements/export";
import {
  calculateSettlementRiskDeduction,
  canLockSettlementRiskDeduction,
  effectiveSettlementAmountCents,
  riskPenaltyDestinationLabel,
  settlementRiskPenaltyDestinationLabels,
  settlementRiskPenaltyDestinations,
  type SettlementRiskPenaltyDestination,
} from "@/lib/settlements/risk-deduction";
import type { AuditLog, Customer, CustomerFeedback, DemoUser, FundTransaction, Rank, RiskCase, Settlement, Task } from "@/types/demo";
import {
  apiApproveTask,
  apiAutoConfirmOverdueTasks,
  apiBuildSettlementsExportPath,
  apiChangePassword,
  apiClaimTask,
  apiConfirmSettlement,
  apiConfirmSettlements,
  apiCreateCustomer,
  apiCreateRiskCase,
  apiCreateTask,
  apiCreateUser,
  apiBuildAuditLogExportPath,
  apiFetchCurrentUser,
  apiFetchFundsPage,
  apiFetchAuditLogs,
  apiFetchAuditLogsPage,
  apiFetchCustomers,
  apiFetchCustomersPage,
  apiFetchRanks,
  apiFetchRiskCases,
  apiFetchRiskCasesPage,
  apiFetchSettlements,
  apiFetchSettlementsPage,
  apiFetchSystemSettings,
  apiFetchTasks,
  apiFetchTasksPage,
  apiFetchUsers,
  apiFetchUsersPage,
  apiLogin,
  apiLockSettlementRiskDeduction,
  apiLogout,
  apiReviewTask,
  apiSubmitPortalFeedback,
  apiSubmitRiskCaseDecision,
  apiSubmitRiskCaseDefense,
  apiSubmitTask,
  apiUpdateUser,
  apiUpdateRiskCaseStatus,
  apiUpdateSystemSettings,
  apiVerifyPortalCode,
  type ApiListParams,
  type ApiPagination,
  type ApiPortalSnapshot,
} from "./api-client";
import { lexosUi } from "./ui-tokens";

type NavKey = MenuPermissionKey;
type MaybePromise<T> = T | Promise<T>;
type SubmitTaskInput = { title: string; content: string; externalUrl: string; file?: File | null };
type ApproveTaskInput = {
  caseResultScore?: number;
  caseResultSummary?: string;
  sourceReviewComment?: string;
  sourceReviewScore?: number;
};
type ReviewTaskInput = { comment?: string; decision: TaskReviewDecision };
type CreateRiskCaseInput = {
  description?: string;
  severity: RiskCase["severity"];
  source: RiskCase["source"];
  taskId?: string;
  title: string;
};
type UpdateRiskCaseStatusInput = { action: RiskCaseAction; resolutionNote?: string };
type SubmitRiskCaseDecisionInput = {
  decision: RiskCaseCommitteeDecision;
  deductionBasisPoints?: number;
  note: string;
};
type LockSettlementRiskDeductionInput = {
  destination?: SettlementRiskPenaltyDestination;
  note?: string;
  riskCaseId?: string;
};

const manageableUserRoleOptions = internalUserRoleOptions;

const userStatusLabels: Record<DemoUser["status"], string> = {
  active: "启用",
  disabled: "停用",
};

const userStatusOptions: Array<[DemoUser["status"], string]> = [
  ["active", "启用"],
  ["disabled", "停用"],
];

const statusLabels: Record<TaskStatus, string> = {
  open: "待承接",
  claimed: "处理中",
  submitted: "待验收",
  approved: "客户待确认",
  customer_confirmed: "客户已确认",
  settlement_pending: "待结算",
  settled: "已结算",
  cancelled: "已取消",
};

const taskReviewStatusLabels = {
  approved: "审核通过",
  changes_requested: "退回修改",
  not_required: "无需审核",
  pending: "待审核",
};

const navIcons: Record<NavKey, ComponentType<{ className?: string }>> = {
  audit: ShieldCheck,
  customers: BriefcaseBusiness,
  dashboard: LayoutDashboard,
  funds: Banknote,
  market: ClipboardList,
  "my-tasks": FileText,
  permissions: LockKeyhole,
  ranks: BadgeCheck,
  risk: AlertTriangle,
  settings: SlidersHorizontal,
  settlements: ReceiptText,
  users: UsersRound,
};

const navItems: Array<{
  key: NavKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
  roles: UserRole[];
}> = menuPermissionItems.map((item) => ({
  ...item,
  icon: navIcons[item.key],
}));

const TABLE_PAGE_SIZE = 8;
const CARD_PAGE_SIZE = 6;
const demoSystemSettings = buildSystemSettingsFromRows([]);

function matchesSearch(query: string, ...values: Array<string | number | null | undefined>): boolean {
  const term = query.trim().toLowerCase();

  if (!term) {
    return true;
  }

  return values.some((value) => `${value ?? ""}`.toLowerCase().includes(term));
}

function paginateItems<T>(items: T[], page: number, pageSize = TABLE_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    currentPage,
    items: items.slice(start, start + pageSize),
    pageSize,
    total: items.length,
    totalPages,
  };
}

function cloneItems<T extends object>(items: T[]): T[] {
  return items.map((item) => ({ ...item }));
}

function systemSettingNumber(settings: SystemSettingItem[], key: string, fallback: number): number {
  const value = settings.find((setting) => setting.key === key)?.value;

  return typeof value === "number" ? value : fallback;
}

function formatDateTimeText(value: Date | string | null | undefined): string {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "-";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function settlementRiskLockError(settlement: Settlement, lockDays: number): string | null {
  const lockStatus = buildSettlementRiskLockStatus(settlement.generatedAt, lockDays);

  if (!lockStatus.locked) {
    return null;
  }

  return `结算仍在 ${lockDays} 天风控锁定期，剩余约 ${lockStatus.daysRemaining} 天，预计 ${formatDateTimeText(lockStatus.lockedUntil)} 后可确认。`;
}

function settlementTaskRiskFreezeStatus(settlement: Settlement, riskCases: RiskCase[]): TaskRiskFreezeStatus {
  if (
    settlement.riskFrozen !== undefined ||
    settlement.riskFreezeCaseCount !== undefined ||
    settlement.riskFreezeHighestSeverity ||
    settlement.riskFreezeReason ||
    settlement.riskDeductionCandidateCaseId ||
    settlement.riskDeductionCandidateBasisPoints !== undefined
  ) {
    return {
      activeRiskCaseCount: settlement.riskFreezeCaseCount ?? 0,
      deductionLockCandidate:
        settlement.riskDeductionCandidateCaseId && settlement.riskDeductionCandidateBasisPoints
          ? {
              basisPoints: settlement.riskDeductionCandidateBasisPoints,
              riskCaseId: settlement.riskDeductionCandidateCaseId,
              title: settlement.riskDeductionCandidateTitle ?? settlement.riskDeductionCandidateCaseId,
            }
          : undefined,
      frozen: Boolean(settlement.riskFrozen),
      highestSeverity: settlement.riskFreezeHighestSeverity,
      riskCaseIds: [],
      riskCaseTitles: settlement.riskFreezeCaseTitles ?? [],
      summary: settlement.riskFreezeReason,
    };
  }

  return buildTaskRiskFreezeStatus(settlement.taskId, riskCases);
}

function settlementRiskDeductionPreview(
  settlement: Settlement,
  taskFreezeStatus: TaskRiskFreezeStatus,
  riskDeductionRates: RiskDeductionRates,
): RiskDeductionPreview | null {
  if (!taskFreezeStatus.highestSeverity) {
    return null;
  }

  if (
    settlement.riskDeductionBasisPoints !== undefined ||
    settlement.riskSuggestedDeductionCents !== undefined ||
    settlement.riskSuggestedPayableCents !== undefined
  ) {
    const basisPoints = settlement.riskDeductionBasisPoints ?? 0;
    const deductionAmountCents = settlement.riskSuggestedDeductionCents ?? 0;

    return {
      basisPoints,
      deductionAmountCents,
      enabled: basisPoints > 0,
      payableAmountCents:
        settlement.riskSuggestedPayableCents ?? Math.max(0, settlement.settlementAmountCents - deductionAmountCents),
      severity: taskFreezeStatus.highestSeverity,
    };
  }

  return calculateRiskDeductionPreview(settlement.settlementAmountCents, taskFreezeStatus.highestSeverity, riskDeductionRates);
}

function riskDeductionPreviewText(preview: RiskDeductionPreview): string {
  if (!preview.enabled) {
    return `建议不扣减 · 扣后 ${formatMoney(preview.payableAmountCents)}`;
  }

  return `建议扣减 ${formatBasisPoints(preview.basisPoints)} · ${formatMoney(preview.deductionAmountCents)}，扣后 ${formatMoney(preview.payableAmountCents)}`;
}

function riskCaseDefenseStatusText(status: RiskCaseDefenseStatus): string {
  if (status.submitted) {
    return "已提交答辩";
  }

  if (status.overdue) {
    return "答辩已超时";
  }

  if (!status.deadlineAt) {
    return "未开始计时";
  }

  return `剩余约 ${status.hoursRemaining} 小时`;
}

function canSubmitRiskCaseDefense(currentUser: DemoUser, riskCase: RiskCase, linkedTask?: Task): boolean {
  const assignedLawyerId = riskCase.taskAssignedLawyerId ?? linkedTask?.assignedLawyerId;

  return isLawyerRole(currentUser.role) && Boolean(assignedLawyerId) && assignedLawyerId === currentUser.id;
}

function canSubmitRiskCaseCommitteeDecision(currentUser: DemoUser): boolean {
  return isDirectorRole(currentUser.role);
}

function riskCaseCommitteeDecisionText(riskCase: RiskCase): string {
  if (!riskCase.committeeDecision) {
    return "未裁决";
  }

  const deductionText =
    riskCase.committeeDecision === "deduction"
      ? ` · ${formatBasisPoints(riskCase.committeeDeductionBasisPoints ?? 0)}`
      : "";

  return `${riskCaseCommitteeDecisionLabels[riskCase.committeeDecision]}${deductionText}`;
}

function fallbackPagination(page = 1, pageSize = TABLE_PAGE_SIZE, total = 0): ApiPagination {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  return {
    page: currentPage,
    pageSize,
    total,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
}

function resultCountText(total: number, label: string, apiMode: boolean): string {
  return `${apiMode ? "服务端共" : "共"} ${total} ${label}`;
}

const auditEntityOptions: Array<[string, string]> = [
  ["all", "全部模块"],
  ["auth", "登录安全"],
  ["users", "用户"],
  ["customers", "客户"],
  ["tasks", "任务"],
  ["customer_portal", "客户门户"],
  ["settlements", "结算"],
  ["funds", "资金"],
  ["risk_cases", "风控工单"],
  ["system_settings", "系统参数"],
];

const auditActionOptions: Array<[string, string]> = [
  ["all", "全部动作"],
  ["auth.login", "登录成功"],
  ["auth.login_failed", "登录失败"],
  ["auth.change_password", "修改密码"],
  ["users.create", "创建用户"],
  ["customers.create", "创建客户"],
  ["tasks.create", "发布任务"],
  ["tasks.claim", "承接"],
  ["tasks.submit", "提交成果"],
  ["tasks.approve", "验收任务"],
  ["tasks.auto_confirm_overdue", "逾期视为交付"],
  ["tasks.cancel", "取消任务"],
  ["customer_portal.feedback", "客户确认"],
  ["settlements.confirm", "确认结算"],
  ["funds.risk_deduction_posted", "扣罚入账"],
  ["risk_cases.create", "创建风控"],
  ["risk_cases.auto_create", "自动风控"],
  ["risk_cases.update_status", "更新风控状态"],
  ["risk_cases.submit_defense", "提交风控答辩"],
  ["risk_cases.committee_decide", "提交委员会裁决"],
  ["system_settings.update", "更新参数"],
];

const userSortOptions: Array<[string, string]> = [
  ["createdAtDesc", "创建时间最新"],
  ["createdAtAsc", "创建时间最早"],
  ["roleAsc", "角色 A-Z"],
  ["statusAsc", "状态 A-Z"],
];

const customerSortOptions: Array<[string, string]> = [
  ["createdAtDesc", "创建时间最新"],
  ["createdAtAsc", "创建时间最早"],
  ["nameAsc", "客户名称 A-Z"],
  ["sourceAsc", "来源 A-Z"],
];

const taskSortOptions: Array<[string, string]> = [
  ["createdAtDesc", "创建时间最新"],
  ["createdAtAsc", "创建时间最早"],
  ["dueAtAsc", "截止时间最近"],
  ["amountDesc", "任务金额最高"],
  ["statusAsc", "状态 A-Z"],
];

const settlementSortOptions: Array<[string, string]> = [
  ["generatedAtDesc", "生成时间最新"],
  ["generatedAtAsc", "生成时间最早"],
  ["amountDesc", "结算金额最高"],
  ["statusAsc", "状态 A-Z"],
];

const fundAccountOptions: Array<[string, string]> = [
  ["all", "全部账户"],
  ...settlementRiskPenaltyDestinations.map((destination) => [
    destination,
    settlementRiskPenaltyDestinationLabels[destination],
  ] satisfies [string, string]),
];

const fundSortOptions: Array<[string, string]> = [
  ["createdAtDesc", "入账时间最新"],
  ["createdAtAsc", "入账时间最早"],
  ["amountDesc", "金额最高"],
  ["accountTypeAsc", "账户 A-Z"],
];

const auditLogSortOptions: Array<[string, string]> = [
  ["createdAtDesc", "时间最新"],
  ["createdAtAsc", "时间最早"],
  ["actionAsc", "动作 A-Z"],
  ["entityTypeAsc", "模块 A-Z"],
];

const riskCaseStatusOptions: Array<[string, string]> = [
  ["all", "全部状态"],
  ["open", riskCaseStatusLabels.open],
  ["in_review", riskCaseStatusLabels.in_review],
  ["resolved", riskCaseStatusLabels.resolved],
];

const riskCaseSeverityOptions: Array<[string, string]> = [
  ["all", "全部级别"],
  ["critical", riskCaseSeverityLabels.critical],
  ["high", riskCaseSeverityLabels.high],
  ["medium", riskCaseSeverityLabels.medium],
  ["low", riskCaseSeverityLabels.low],
];

const riskCaseSourceOptions: Array<[string, string]> = [
  ["all", "全部来源"],
  ["customer_complaint", riskCaseSourceLabels.customer_complaint],
  ["low_score", riskCaseSourceLabels.low_score],
  ["manual", riskCaseSourceLabels.manual],
];

const riskCaseSortOptions: Array<[string, string]> = [
  ["createdAtDesc", "创建时间最新"],
  ["createdAtAsc", "创建时间最早"],
  ["severityAsc", "风险级别 A-Z"],
  ["statusAsc", "状态 A-Z"],
];

type DemoSortValue = number | string | null | undefined;
type DemoSortRule<T> = {
  direction: "asc" | "desc";
  select: (item: T) => DemoSortValue;
};

function sortDemoItems<T>(items: T[], sort: string, rules: Record<string, DemoSortRule<T>>): T[] {
  const rule = rules[sort];

  if (!rule) {
    return items;
  }

  return [...items].sort((first, second) => compareDemoSortValue(rule.select(first), rule.select(second), rule.direction));
}

function compareDemoSortValue(first: DemoSortValue, second: DemoSortValue, direction: "asc" | "desc"): number {
  const firstValue = first ?? "";
  const secondValue = second ?? "";
  const result =
    typeof firstValue === "number" && typeof secondValue === "number"
      ? firstValue - secondValue
      : String(firstValue).localeCompare(String(secondValue), "zh-CN", { numeric: true });

  return direction === "asc" ? result : -result;
}

export function LexosDemoApp() {
  const apiMode = process.env.NEXT_PUBLIC_DEMO_MODE === "false";
  const [users, setUsers] = useState<DemoUser[]>(() => cloneItems(demoUsers));
  const [ranks, setRanks] = useState<Rank[]>(() => cloneItems(demoRanks));
  const [customers, setCustomers] = useState<Customer[]>(() => cloneItems(demoCustomers));
  const [tasks, setTasks] = useState<Task[]>(() => cloneItems(demoTasks));
  const [settlements, setSettlements] = useState<Settlement[]>(() => cloneItems(demoSettlements));
  const [feedback, setFeedback] = useState<CustomerFeedback[]>(() => cloneItems(demoFeedback));
  const [riskCases, setRiskCases] = useState<RiskCase[]>(() => cloneItems(demoRiskCases));
  const [fundTransactions, setFundTransactions] = useState<FundTransaction[]>(() => cloneItems(demoFundTransactions));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => cloneItems(demoAuditLogs));
  const [systemSettings, setSystemSettings] = useState<SystemSettingItem[]>(demoSystemSettings);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [pendingPasswordUserId, setPendingPasswordUserId] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState<NavKey>("dashboard");
  const [appError, setAppError] = useState<string | null>(null);
  const [appNotice, setAppNotice] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [portalTokensByTaskId, setPortalTokensByTaskId] = useState<Record<string, string>>({});
  const [workspaceVersion, setWorkspaceVersion] = useState(0);

  const currentUser = users.find((user) => user.id === sessionUserId) ?? null;
  const pendingPasswordUser = users.find((user) => user.id === pendingPasswordUserId) ?? null;

  const rankByCode = useMemo(() => new Map(ranks.map((rank) => [rank.code, rank])), [ranks]);
  const usersById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
  const customersById = useMemo(() => new Map(customers.map((customer) => [customer.id, customer])), [customers]);
  const riskDeductionRates = useMemo(() => buildRiskDeductionRatesFromSettings(systemSettings), [systemSettings]);
  const settlementLockDays = systemSettingNumber(systemSettings, "settlement_lock_days", 30);
  const customerAutoConfirmDays = systemSettingNumber(
    systemSettings,
    "customer_auto_confirm_days",
    DEFAULT_CUSTOMER_AUTO_CONFIRM_DAYS,
  );

  async function reloadApiWorkspace(user: DemoUser, tokens = portalTokensByTaskId) {
    const nextRanks = await apiFetchRanks();
    const configRole = isSystemConfigRole(user.role);
    const directorRole = isDirectorRole(user.role);
    const lawyerRole = isLawyerRole(user.role);
    const loadUsers = configRole || directorRole;
    const loadCustomers = directorRole || lawyerRole;
    const loadSettlements = directorRole || lawyerRole || user.role === "finance";
    const loadFunds = directorRole || user.role === "finance";
    const loadAuditLogs = configRole || directorRole;
    const loadSystemSettings = configRole;
    const loadRiskCases = directorRole || lawyerRole;

    const [
      nextUsers,
      nextCustomers,
      nextTasks,
      nextSettlements,
      nextFunds,
      nextAuditLogs,
      nextSystemSettings,
      nextRiskCases,
    ] = await Promise.all([
      loadUsers ? apiFetchUsers() : Promise.resolve([user]),
      loadCustomers ? apiFetchCustomers() : Promise.resolve([]),
      apiFetchTasks(nextRanks, tokens),
      loadSettlements ? apiFetchSettlements(nextRanks) : Promise.resolve([]),
      loadFunds ? apiFetchFundsPage().then((result) => result.items).catch(() => []) : Promise.resolve([]),
      loadAuditLogs ? apiFetchAuditLogs() : Promise.resolve([]),
      loadSystemSettings ? apiFetchSystemSettings() : Promise.resolve(demoSystemSettings),
      loadRiskCases ? apiFetchRiskCases() : Promise.resolve([]),
    ]);

    setRanks(nextRanks);
    setUsers(mergeCurrentUser(nextUsers, user));
    setCustomers(mergeCustomersFromTasks(nextCustomers, nextTasks));
    setTasks(nextTasks);
    setSettlements(nextSettlements);
    setFundTransactions(nextFunds);
    setAuditLogs(nextAuditLogs);
    setSystemSettings(nextSystemSettings);
    setRiskCases(nextRiskCases);
    setWorkspaceVersion((version) => version + 1);
  }

  useEffect(() => {
    if (!apiMode) {
      return;
    }

    let active = true;

    async function bootstrap() {
      setAppError(null);

      try {
        const user = await apiFetchCurrentUser();

        if (!active) {
          return;
        }

        setUsers([user]);

        if (user.mustChangePassword) {
          setPendingPasswordUserId(user.id);
          return;
        }

        setSessionUserId(user.id);
        await reloadApiWorkspace(user);
      } catch (error) {
        if (!active) {
          return;
        }

        setSessionUserId(null);
        setPendingPasswordUserId(null);
        const message = error instanceof Error ? error.message : "无法连接真实 API";

        if (!message.includes("请先登录")) {
          setAppError(message);
        }
      } finally {
        if (active) {
          setIsBootstrapping(false);
        }
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
    // Bootstrap should only react to API mode changes; mutation flows reload explicitly with fresh tokens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiMode]);

  useEffect(() => {
    if (!appNotice) {
      return;
    }

    const timer = window.setTimeout(() => {
      setAppNotice(null);
    }, 3600);

    return () => {
      window.clearTimeout(timer);
    };
  }, [appNotice]);

  function showNotice(message: string) {
    setAppError(null);
    setAppNotice(message);
  }

  function showError(message: string) {
    setAppNotice(null);
    setAppError(message);
  }

  function resetDemoWorkspace() {
    if (apiMode) {
      return;
    }

    const nextUsers = cloneItems(demoUsers);
    const nextSessionUserId =
      currentUser && nextUsers.some((user) => user.id === currentUser.id) ? currentUser.id : "u-admin";

    setUsers(nextUsers);
    setRanks(cloneItems(demoRanks));
    setCustomers(cloneItems(demoCustomers));
    setTasks(cloneItems(demoTasks));
    setSettlements(cloneItems(demoSettlements));
    setFeedback(cloneItems(demoFeedback));
    setRiskCases(cloneItems(demoRiskCases));
    setFundTransactions(cloneItems(demoFundTransactions));
    setAuditLogs(cloneItems(demoAuditLogs));
    setSystemSettings(cloneItems(demoSystemSettings));
    setPortalTokensByTaskId({});
    setPendingPasswordUserId(null);
    setSessionUserId(nextSessionUserId);
    setActiveNav("dashboard");
    setWorkspaceVersion((version) => version + 1);
    showNotice("本地数据已恢复到标准脚本。");
  }

  function log(actor: string, action: string, entity: string, actionCode = action) {
    setAuditLogs((items) => [
      {
        id: `a-${Date.now()}`,
        actor,
        action,
        entity,
        actionCode,
        entityType: entity.split("/")[0] ?? entity,
        createdAt: nowText(),
        rawCreatedAt: new Date().toISOString(),
      },
      ...items,
    ]);
  }

  function registerDemoLowScoreRiskCase(input: {
    comment?: string;
    customerId?: string;
    customerName?: string;
    score?: number;
    scoreLabel: string;
    task: Task;
  }): string | null {
    if (!shouldCreateLowScoreRiskCase(input.score)) {
      return null;
    }

    const score = Number(input.score);
    const draft = buildLowScoreRiskCaseDraft({
      comment: input.comment,
      score,
      scoreLabel: input.scoreLabel,
      taskTitle: input.task.title,
    });
    const id = `r-auto-${Date.now()}`;

    setRiskCases((items) => [
      {
        ...draft,
        createdAt: nowText(),
        customerId: input.customerId,
        customerName: input.customerName,
        id,
        rawCreatedAt: new Date().toISOString(),
        taskId: input.task.id,
        taskTitle: input.task.title,
      },
      ...items,
    ]);
    log("系统", `低分自动生成风控 ${input.task.title}`, "risk_cases", "risk_cases.auto_create");

    return id;
  }

  async function createRiskCase(input: CreateRiskCaseInput) {
    if (!currentUser || (!isDirectorRole(currentUser.role) && !isLawyerRole(currentUser.role))) {
      return;
    }

    const task = input.taskId ? tasks.find((item) => item.id === input.taskId) : undefined;
    const customer = task ? customersById.get(task.customerId) : undefined;

    if (apiMode) {
      try {
        const riskCase = await apiCreateRiskCase({
          ...input,
          customerId: customer?.id,
        });

        setRiskCases((items) => [riskCase, ...items]);
        setWorkspaceVersion((version) => version + 1);
        showNotice("风控工单已创建。");
      } catch (error) {
        showError(error instanceof Error ? error.message : "创建风控工单失败");
      }
      return;
    }

    const riskCase: RiskCase = {
      ...input,
      createdAt: nowText(),
      customerId: customer?.id,
      customerName: customer?.name,
      id: `r-${Date.now()}`,
      rawCreatedAt: new Date().toISOString(),
      reportedByUserId: currentUser.id,
      reporterName: currentUser.displayName,
      status: "open",
      taskTitle: task?.title,
    };

    setRiskCases((items) => [riskCase, ...items]);
    log(currentUser.displayName, `创建风控工单 ${input.title}`, "risk_cases", "risk_cases.create");
    showNotice("风控工单已创建。");
  }

  async function updateRiskCaseStatus(riskCaseId: string, input: UpdateRiskCaseStatusInput) {
    if (!currentUser || (!isDirectorRole(currentUser.role) && !isLawyerRole(currentUser.role))) {
      return;
    }

    if (apiMode) {
      try {
        const updatedRiskCase = await apiUpdateRiskCaseStatus(riskCaseId, input);

        setRiskCases((items) => items.map((item) => (item.id === riskCaseId ? updatedRiskCase : item)));
        setWorkspaceVersion((version) => version + 1);
        showNotice(`风控工单已${riskCaseActionLabels[input.action]}。`);
      } catch (error) {
        showError(error instanceof Error ? error.message : "更新风控工单失败");
      }
      return;
    }

    const existing = riskCases.find((item) => item.id === riskCaseId);

    if (!existing) {
      showError("风控工单不存在");
      return;
    }

    if (isLawyerRole(currentUser.role) && existing.reportedByUserId !== currentUser.id) {
      showError("律师只能处理自己登记的风控工单");
      return;
    }

    let statusUpdate;

    try {
      statusUpdate = normalizeRiskCaseStatusUpdate(input, existing.status);
    } catch (error) {
      showError(error instanceof Error ? error.message : "风控状态参数不正确");
      return;
    }

    const rawUpdatedAt = new Date().toISOString();
    const nextResolutionNote =
      statusUpdate.action === "resolve" || (statusUpdate.action === "reopen" && statusUpdate.resolutionNote)
        ? statusUpdate.resolutionNote
        : existing.resolutionNote;

    setRiskCases((items) =>
      items.map((item) =>
        item.id === riskCaseId
          ? {
              ...item,
              ownerName: currentUser.displayName,
              ownerUserId: currentUser.id,
              rawUpdatedAt,
              resolutionNote: nextResolutionNote,
              resolvedAt: statusUpdate.nextStatus === "resolved" ? rawUpdatedAt : undefined,
              status: statusUpdate.nextStatus,
              updatedAt: nowText(),
            }
          : item,
      ),
    );
    log(
      currentUser.displayName,
      `${riskCaseActionLabels[input.action]}风控工单 ${existing.title}`,
      "risk_cases",
      "risk_cases.update_status",
    );
    showNotice(`风控工单已${riskCaseActionLabels[input.action]}。`);
  }

  async function submitRiskCaseDefense(riskCaseId: string, defenseStatement: string) {
    if (!currentUser || !isLawyerRole(currentUser.role)) {
      return;
    }

    if (apiMode) {
      try {
        const updatedRiskCase = await apiSubmitRiskCaseDefense(riskCaseId, defenseStatement);

        setRiskCases((items) => items.map((item) => (item.id === riskCaseId ? updatedRiskCase : item)));
        setWorkspaceVersion((version) => version + 1);
        showNotice("风控答辩已提交。");
      } catch (error) {
        showError(error instanceof Error ? error.message : "提交风控答辩失败");
      }
      return;
    }

    const existing = riskCases.find((item) => item.id === riskCaseId);
    const linkedTask = existing?.taskId ? tasks.find((task) => task.id === existing.taskId) : undefined;

    if (!existing) {
      showError("风控工单不存在");
      return;
    }

    if (!canSubmitRiskCaseDefense(currentUser, existing, linkedTask)) {
      showError("律师只能答辩自己承办任务的风控工单");
      return;
    }

    const defenseStatus = buildRiskCaseDefenseStatus({
      createdAt: existing.rawCreatedAt ?? existing.createdAt,
      defendedAt: existing.defendedAt,
      status: existing.status,
    });

    if (!defenseStatus.canSubmit) {
      showError(defenseStatus.submitted ? "该风控工单已提交答辩" : "答辩期限已超过 48 小时");
      return;
    }

    let input;

    try {
      input = normalizeRiskCaseDefenseInput({ defenseStatement });
    } catch (error) {
      showError(error instanceof Error ? error.message : "答辩参数不正确");
      return;
    }

    const defendedAt = new Date().toISOString();

    setRiskCases((items) =>
      items.map((item) =>
        item.id === riskCaseId
          ? {
              ...item,
              defendedAt,
              defenseStatement: input.defenseStatement,
              rawUpdatedAt: defendedAt,
              updatedAt: nowText(),
            }
          : item,
      ),
    );
    log(currentUser.displayName, `提交风控答辩 ${existing.title}`, "risk_cases", "risk_cases.submit_defense");
    showNotice("风控答辩已提交。");
  }

  async function submitRiskCaseDecision(riskCaseId: string, input: SubmitRiskCaseDecisionInput) {
    if (!currentUser || !canSubmitRiskCaseCommitteeDecision(currentUser)) {
      return;
    }

    if (apiMode) {
      try {
        const updatedRiskCase = await apiSubmitRiskCaseDecision(riskCaseId, input);

        setRiskCases((items) => items.map((item) => (item.id === riskCaseId ? updatedRiskCase : item)));
        setWorkspaceVersion((version) => version + 1);
        showNotice("风控委员会裁决已提交。");
      } catch (error) {
        showError(error instanceof Error ? error.message : "提交风控委员会裁决失败");
      }
      return;
    }

    const existing = riskCases.find((item) => item.id === riskCaseId);

    if (!existing) {
      showError("风控工单不存在");
      return;
    }

    let decisionInput;

    try {
      decisionInput = normalizeRiskCaseCommitteeDecisionInput(input);
    } catch (error) {
      showError(error instanceof Error ? error.message : "委员会裁决参数不正确");
      return;
    }

    const defenseStatus = buildRiskCaseDefenseStatus({
      createdAt: existing.rawCreatedAt ?? existing.createdAt,
      defendedAt: existing.defendedAt,
      status: existing.status,
    });
    const permission = canSubmitCommitteeDecision({
      defenseOverdue: defenseStatus.overdue,
      defenseSubmitted: defenseStatus.submitted,
      existingDecision: existing.committeeDecision,
      status: existing.status,
    });

    if (!permission.allowed) {
      showError(permission.reason ?? "当前风控工单不能提交委员会裁决");
      return;
    }

    const decidedAt = new Date().toISOString();

    setRiskCases((items) =>
      items.map((item) =>
        item.id === riskCaseId
          ? {
              ...item,
              committeeDecidedAt: decidedAt,
              committeeDecidedByUserId: currentUser.id,
              committeeDeciderName: currentUser.displayName,
              committeeDecision: decisionInput.decision,
              committeeDecisionNote: decisionInput.note,
              committeeDeductionBasisPoints: decisionInput.deductionBasisPoints,
              ownerName: currentUser.displayName,
              ownerUserId: currentUser.id,
              rawUpdatedAt: decidedAt,
              resolutionNote: decisionInput.nextStatus === "resolved" ? decisionInput.note : item.resolutionNote,
              resolvedAt: decisionInput.nextStatus === "resolved" ? decidedAt : undefined,
              status: decisionInput.nextStatus,
              updatedAt: nowText(),
            }
          : item,
      ),
    );
    log(currentUser.displayName, `提交委员会裁决 ${existing.title}`, "risk_cases", "risk_cases.committee_decide");
    showNotice("风控委员会裁决已提交。");
  }

  async function handleLogin(username: string, password: string) {
    if (apiMode) {
      try {
        setAppError(null);
        const result = await apiLogin(username, password);
        setUsers([result.user]);

        if (result.mustChangePassword) {
          setPendingPasswordUserId(result.user.id);
          return null;
        }

        setSessionUserId(result.user.id);
        setActiveNav("dashboard");
        await reloadApiWorkspace(result.user);
        return null;
      } catch (error) {
        return error instanceof Error ? error.message : "登录失败";
      }
    }

    const user = users.find(
      (item) => item.username === username.trim() && item.password === password && item.status === "active",
    );

    if (!user) {
      return "用户名或密码不正确";
    }

    log(user.displayName, "登录系统", "auth");

    if (user.mustChangePassword) {
      setPendingPasswordUserId(user.id);
      return null;
    }

    setSessionUserId(user.id);
    setActiveNav("dashboard");
    return null;
  }

  async function handleChangePassword(userId: string, newPassword: string) {
    if (apiMode) {
      await apiChangePassword(newPassword);
      const user = users.find((item) => item.id === userId);
      const updatedUser = user ? { ...user, mustChangePassword: false } : await apiFetchCurrentUser();

      setUsers([updatedUser]);
      setPendingPasswordUserId(null);
      setSessionUserId(userId);
      setActiveNav("dashboard");
      await reloadApiWorkspace(updatedUser);
      showNotice("密码已更新，已进入工作台。");
      return;
    }

    setUsers((items) =>
      items.map((user) =>
        user.id === userId
          ? {
              ...user,
              password: newPassword,
              mustChangePassword: false,
            }
          : user,
      ),
    );
    const user = users.find((item) => item.id === userId);
    log(user?.displayName ?? "用户", "首次登录修改密码", "auth");
    setPendingPasswordUserId(null);
    setSessionUserId(userId);
    setActiveNav("dashboard");
    showNotice("密码已更新，已进入工作台。");
  }

  async function logout() {
    if (apiMode) {
      await apiLogout().catch(() => undefined);
    }

    setSessionUserId(null);
    setPendingPasswordUserId(null);
    setActiveNav("dashboard");
  }

  async function addUser(input: { username: string; displayName: string; role: UserRole; rankCode?: string }) {
    if (apiMode && currentUser) {
      try {
        const rank = input.rankCode ? ranks.find((item) => item.code === input.rankCode) : undefined;
        await apiCreateUser({
          username: input.username,
          displayName: input.displayName,
          roleCode: input.role,
          rankId: isLawyerRole(input.role) ? rank?.id : undefined,
        });
        await reloadApiWorkspace(currentUser);
        showNotice(`用户 ${input.displayName} 已创建。`);
      } catch (error) {
        showError(error instanceof Error ? error.message : "创建用户失败");
      }
      return;
    }

    const profile = createInitialUserProfile(input.username, input.displayName);
    const user: DemoUser = {
      id: `u-${Date.now()}`,
      username: profile.username,
      displayName: profile.displayName,
      role: input.role,
      rankCode: input.rankCode,
      password: profile.defaultPassword,
      mustChangePassword: profile.mustChangePassword,
      status: "active",
    };
    setUsers((items) => [user, ...items]);
    log(currentUser?.displayName ?? "系统", `创建用户 ${user.username}`, "users");
    showNotice(`用户 ${user.displayName} 已创建。`);
  }

  async function updateUser(input: {
    rankCode?: string;
    role: UserRole;
    status: DemoUser["status"];
    userId: string;
  }) {
    if (!currentUser || !isSystemConfigRole(currentUser.role)) {
      return;
    }

    if (input.userId === currentUser.id && (input.status !== "active" || input.role !== currentUser.role)) {
      showError("不能停用或变更当前登录账号的角色。");
      return;
    }

    if (apiMode) {
      try {
        const rank = input.rankCode ? ranks.find((item) => item.code === input.rankCode) : undefined;
        await apiUpdateUser(input.userId, {
          roleCode: input.role,
          rankId: isLawyerRole(input.role) ? rank?.id : undefined,
          status: input.status,
        });
        await reloadApiWorkspace(currentUser);
        showNotice("用户配置已更新。");
      } catch (error) {
        showError(error instanceof Error ? error.message : "更新用户失败");
      }
      return;
    }

    setUsers((items) =>
      items.map((user) =>
        user.id === input.userId
          ? {
              ...user,
              rankCode: isLawyerRole(input.role) ? input.rankCode : undefined,
              role: input.role,
              status: input.status,
            }
          : user,
      ),
    );
    log(currentUser.displayName, `更新用户 ${input.userId}`, "users");
    showNotice("用户配置已更新。");
  }

  async function addCustomer(input: { name: string; contactName: string; phone: string; source: string }) {
    if (apiMode && currentUser) {
      try {
        await apiCreateCustomer(input);
        await reloadApiWorkspace(currentUser);
        showNotice(`客户 ${input.name} 已保存。`);
      } catch (error) {
        showError(error instanceof Error ? error.message : "创建客户失败");
      }
      return;
    }

    const customer: Customer = {
      id: `c-${Date.now()}`,
      ...input,
    };
    setCustomers((items) => [customer, ...items]);
    log(currentUser?.displayName ?? "系统", `创建客户 ${customer.name}`, "customers");
    showNotice(`客户 ${customer.name} 已保存。`);
  }

  async function addTask(input: {
    customerId: string;
    title: string;
    description: string;
    taskType: string;
    amountCents: number;
    minRankCode: string;
    dueAt: string;
    reviewLawyerId?: string;
    reviewRequired?: boolean;
  }) {
    if (!currentUser) {
      return;
    }

    if (apiMode) {
      try {
        const minRank = ranks.find((rank) => rank.code === input.minRankCode);
        const result = await apiCreateTask({
          customerId: input.customerId,
          title: input.title,
          description: input.description,
          taskType: input.taskType,
          amountCents: input.amountCents,
          minRankId: minRank?.id,
          reviewLawyerId: input.reviewLawyerId,
          reviewRequired: input.reviewRequired,
          dueAt: input.dueAt,
        });
        const nextTokens = { ...portalTokensByTaskId, [result.taskId]: result.portalToken };
        setPortalTokensByTaskId(nextTokens);
        await reloadApiWorkspace(currentUser, nextTokens);
        showNotice(`任务 ${input.title} 已发布，客户访问 token 已生成。`);
      } catch (error) {
        showError(error instanceof Error ? error.message : "发布任务失败");
      }
      return;
    }

    const task: Task = {
      id: `t-${Date.now()}`,
      sourceLawyerId: currentUser.id,
      status: "open",
      portalToken: `LEXOS-${Date.now()}`,
      reviewLawyerId: input.reviewLawyerId,
      reviewRequired: Boolean(input.reviewRequired),
      reviewStatus: input.reviewRequired ? "pending" : "not_required",
      ...input,
    };
    setTasks((items) => [task, ...items]);
    log(currentUser.displayName, `发布任务 ${task.title}`, "tasks");
    showNotice(`任务 ${task.title} 已发布到任务大厅。`);
  }

  async function claimTask(taskId: string) {
    if (!currentUser) {
      return;
    }

    if (apiMode) {
      try {
        await apiClaimTask(taskId);
        await reloadApiWorkspace(currentUser);
        showNotice("承接成功，任务已进入我的任务。");
      } catch (error) {
        showError(error instanceof Error ? error.message : "承接失败");
      }
      return;
    }

    const userRank = currentUser.rankCode ? rankByCode.get(currentUser.rankCode) : null;
    const task = tasks.find((item) => item.id === taskId);
    const minRank = task ? rankByCode.get(task.minRankCode) : null;

    if (!task || !userRank || !minRank) {
      return;
    }

    const claimPermission = canClaimTaskWithRestriction({
      taskStatus: task.status,
      userRole: currentUser.role,
      lawyerRankOrder: userRank.sortOrder,
      minRankOrder: minRank.sortOrder,
      restriction: buildUserClaimRiskRestriction(currentUser.id, tasks, riskCases),
    });

    if (!claimPermission.allowed) {
      showError(claimPermission.reason ?? "当前任务不可承接");
      return;
    }

    setTasks((items) =>
      items.map((item) =>
        item.id === taskId
          ? {
              ...item,
              status: transitionTaskStatus(item.status, "claim"),
              assignedLawyerId: currentUser.id,
            }
          : item,
      ),
    );
    log(currentUser.displayName, `承接 ${task.title}`, "tasks");
    showNotice(`已承接：${task.title}`);
  }

  async function submitTask(taskId: string, input: SubmitTaskInput) {
    if (!currentUser) {
      return;
    }

    if (apiMode) {
      try {
        await apiSubmitTask(taskId, input);
        await reloadApiWorkspace(currentUser);
        showNotice("成果已提交，等待发起人验收。");
      } catch (error) {
        showError(error instanceof Error ? error.message : "提交成果失败");
      }
      return;
    }

    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.status !== "claimed" || task.assignedLawyerId !== currentUser.id) {
      return;
    }

    setTasks((items) =>
      items.map((item) =>
        item.id === taskId
          ? {
              ...item,
              status: transitionTaskStatus(item.status, "submit"),
              reviewComment: undefined,
              reviewedAt: undefined,
              reviewStatus: item.reviewRequired ? "pending" : "not_required",
              deliverables: [
                ...(item.deliverables ?? []),
                {
                  id: `d-${Date.now()}`,
                  title: input.title,
                  content: input.content,
                  externalUrl: input.externalUrl,
                  fileMimeType: input.file?.type,
                  fileName: input.file?.name,
                  fileSizeBytes: input.file?.size,
                  submittedAt: nowText(),
                },
              ],
              submittedTitle: input.title,
              submittedContent: input.content,
              externalUrl: input.externalUrl,
            }
          : item,
      ),
    );
    log(currentUser.displayName, `提交成果 ${task.title}`, "tasks");
    showNotice(`成果已提交：${task.title}`);
  }

  async function approveTask(taskId: string, input: ApproveTaskInput) {
    if (!currentUser) {
      return;
    }

    if (apiMode) {
      try {
        await apiApproveTask(taskId, input);
        await reloadApiWorkspace(currentUser);
        showNotice("任务已验收，客户可在大屏确认接收。");
      } catch (error) {
        showError(error instanceof Error ? error.message : "验收任务失败");
      }
      return;
    }

    const task = tasks.find((item) => item.id === taskId);
    if (
      !task ||
      task.status !== "submitted" ||
      task.sourceLawyerId !== currentUser.id ||
      !isTaskReviewSatisfied({ reviewRequired: task.reviewRequired, reviewStatus: task.reviewStatus })
    ) {
      return;
    }

    setTasks((items) =>
      items.map((item) =>
        item.id === taskId
          ? {
              ...item,
              status: transitionTaskStatus(item.status, "approve"),
              approvedAt: nowText(),
              caseResultScore: input.caseResultScore,
              caseResultSummary: input.caseResultSummary,
              sourceReviewComment: input.sourceReviewComment,
              sourceReviewScore: input.sourceReviewScore,
              sourceReviewedAt: nowText(),
            }
          : item,
      ),
    );
    const sourceScoreRiskCaseId = registerDemoLowScoreRiskCase({
      comment: input.sourceReviewComment,
      customerId: task.customerId,
      customerName: customersById.get(task.customerId)?.name,
      score: input.sourceReviewScore,
      scoreLabel: "发起人评分",
      task,
    });

    if (!sourceScoreRiskCaseId) {
      registerDemoLowScoreRiskCase({
        comment: input.caseResultSummary,
        customerId: task.customerId,
        customerName: customersById.get(task.customerId)?.name,
        score: input.caseResultScore,
        scoreLabel: "案件结果评分",
        task,
      });
    }
    log(currentUser.displayName, `验收任务 ${task.title}`, "tasks");
    showNotice(`任务已验收：${task.title}`);
  }

  async function reviewTask(taskId: string, input: ReviewTaskInput) {
    if (!currentUser) {
      return;
    }

    if (apiMode) {
      try {
        await apiReviewTask(taskId, input);
        await reloadApiWorkspace(currentUser);
        showNotice(input.decision === "approved" ? "审核已通过，发起人可继续验收。" : "已退回承办律师修改。");
      } catch (error) {
        showError(error instanceof Error ? error.message : "审核任务失败");
      }
      return;
    }

    const task = tasks.find((item) => item.id === taskId);

    if (
      !task ||
      !canReviewTask({
        currentUserId: currentUser.id,
        reviewLawyerId: task.reviewLawyerId,
        reviewRequired: task.reviewRequired,
        reviewStatus: task.reviewStatus,
        taskStatus: task.status,
        userRole: currentUser.role,
      })
    ) {
      return;
    }

    setTasks((items) =>
      items.map((item) =>
        item.id === taskId
          ? {
              ...item,
              reviewComment: input.comment,
              reviewedAt: nowText(),
              reviewLawyerId: item.reviewLawyerId ?? currentUser.id,
              reviewStatus: input.decision,
              status: input.decision === "approved" ? "submitted" : "claimed",
            }
          : item,
      ),
    );
    log(currentUser.displayName, `${input.decision === "approved" ? "审核通过" : "退回修改"} ${task.title}`, "tasks");
    showNotice(input.decision === "approved" ? `审核已通过：${task.title}` : `已退回修改：${task.title}`);
  }

  function confirmCustomerDelivery(taskId: string, score: number, comment: string) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.status !== "approved" || !task.assignedLawyerId) {
      return;
    }

    const lawyer = usersById.get(task.assignedLawyerId);
    const rank = lawyer?.rankCode ? rankByCode.get(lawyer.rankCode) : null;
    if (!lawyer || !rank) {
      return;
    }

    const settlementAmountCents = calculateSettlementAmount(task.amountCents, rank.settlementBasisPoints);
    const settlement: Settlement = {
      id: `s-${Date.now()}`,
      taskId: task.id,
      lawyerId: lawyer.id,
      rankCode: rank.code,
      taskAmountCents: task.amountCents,
      settlementBasisPoints: rank.settlementBasisPoints,
      settlementAmountCents,
      payableAmountCents: settlementAmountCents,
      status: "pending",
      generatedAt: new Date().toISOString(),
    };

    setFeedback((items) => [
      {
        taskId,
        score,
        comment,
        confirmedAt: nowText(),
      },
      ...items,
    ]);
    setSettlements((items) => [settlement, ...items]);
    setTasks((items) =>
      items.map((item) =>
        item.id === taskId
          ? {
              ...item,
              status: transitionTaskStatus(transitionTaskStatus(item.status, "customer_confirm"), "generate_settlement"),
              customerConfirmedAt: nowText(),
            }
          : item,
      ),
    );
    registerDemoLowScoreRiskCase({
      comment,
      customerId: task.customerId,
      customerName: customersById.get(task.customerId)?.name,
      score,
      scoreLabel: "客户评分",
      task,
    });
    log("客户", `确认接收并评分 ${task.title}`, "customer_portal");
    log("系统", `生成结算 ${formatMoney(settlementAmountCents)}`, "settlements");
    showNotice("客户已确认接收，待结算记录已生成。");
  }

  async function autoConfirmOverdueTasks() {
    if (!currentUser || !isSystemConfigRole(currentUser.role)) {
      return;
    }

    if (apiMode) {
      try {
        const result = await apiAutoConfirmOverdueTasks();
        await reloadApiWorkspace(currentUser);
        showNotice(
          result.processedCount
            ? `已处理 ${result.processedCount} 个逾期未确认任务。`
            : `暂无超过 ${result.autoConfirmDays} 天的客户待确认任务。`,
        );
      } catch (error) {
        showError(error instanceof Error ? error.message : "处理逾期确认失败");
      }
      return;
    }

    if (customerAutoConfirmDays <= 0) {
      showNotice("客户逾期自动确认已停用。");
      return;
    }

    const now = new Date();
    const existingSettlementTaskIds = new Set(settlements.map((settlement) => settlement.taskId));
    const generatedAt = now.toISOString();
    const confirmedAt = nowText();
    const nextSettlements: Settlement[] = [];
    const processedTaskIds = new Set<string>();

    tasks.forEach((task) => {
      if (
        existingSettlementTaskIds.has(task.id) ||
        !buildCustomerAutoConfirmStatus(task, customerAutoConfirmDays, now).due ||
        !task.assignedLawyerId
      ) {
        return;
      }

      const lawyer = usersById.get(task.assignedLawyerId);
      const rank = lawyer?.rankCode ? rankByCode.get(lawyer.rankCode) : undefined;

      if (!lawyer || !rank) {
        return;
      }

      const settlementAmountCents = calculateSettlementAmount(task.amountCents, rank.settlementBasisPoints);

      nextSettlements.push({
        generatedAt,
        id: `s-auto-${Date.now()}-${nextSettlements.length + 1}`,
        lawyerId: lawyer.id,
        lawyerName: lawyer.displayName,
        rankCode: rank.code,
        rankId: rank.id,
        settlementAmountCents,
        payableAmountCents: settlementAmountCents,
        settlementBasisPoints: rank.settlementBasisPoints,
        status: "pending",
        taskAmountCents: task.amountCents,
        taskId: task.id,
        taskTitle: task.title,
      });
      processedTaskIds.add(task.id);
    });

    if (!nextSettlements.length) {
      showNotice(`暂无超过 ${customerAutoConfirmDays} 天的客户待确认任务。`);
      return;
    }

    setSettlements((items) => [...nextSettlements, ...items]);
    setTasks((items) =>
      items.map((item) =>
        processedTaskIds.has(item.id)
          ? {
              ...item,
              customerConfirmedAt: confirmedAt,
              status: transitionTaskStatus(transitionTaskStatus(item.status, "customer_confirm"), "generate_settlement"),
            }
          : item,
      ),
    );
    log(
      currentUser.displayName,
      `逾期视为交付 ${nextSettlements.length} 个任务`,
      "tasks",
      "tasks.auto_confirm_overdue",
    );
    log("系统", `逾期生成结算 ${nextSettlements.length} 条`, "settlements", "tasks.auto_confirm_overdue");
    showNotice(`已处理 ${nextSettlements.length} 个逾期未确认任务。`);
  }

  async function confirmSettlement(settlementId: string) {
    if (!currentUser || currentUser.role !== "finance") {
      return;
    }

    if (apiMode) {
      try {
        await apiConfirmSettlement(settlementId);
        await reloadApiWorkspace(currentUser);
        showNotice("结算已确认。");
      } catch (error) {
        showError(error instanceof Error ? error.message : "确认结算失败");
      }
      return;
    }

    const settlement = settlements.find((item) => item.id === settlementId);
    if (!settlement || settlement.status !== "pending") {
      return;
    }

    const taskFreezeStatus = settlementTaskRiskFreezeStatus(settlement, riskCases);

    if (taskFreezeStatus.frozen) {
      showError(formatTaskRiskFreezeError(taskFreezeStatus));
      return;
    }

    const lockError = settlementRiskLockError(settlement, settlementLockDays);

    if (lockError) {
      showError(lockError);
      return;
    }

    const confirmedAt = new Date().toISOString();

    setSettlements((items) =>
      items.map((item) => (item.id === settlementId ? { ...item, status: "confirmed", confirmedAt } : item)),
    );
    setTasks((items) =>
      items.map((item) => (item.id === settlement.taskId ? { ...item, status: transitionTaskStatus(item.status, "settle") } : item)),
    );
    log(currentUser.displayName, `确认结算 ${settlement.id}`, "settlements");
    showNotice("结算已确认。");
  }

  async function confirmSettlementBatch(settlementIds: string[]) {
    if (!currentUser || currentUser.role !== "finance") {
      return;
    }

    const uniqueIds = Array.from(new Set(settlementIds));

    if (!uniqueIds.length) {
      return;
    }

    if (apiMode) {
      try {
        const result = await apiConfirmSettlements(uniqueIds);
        await reloadApiWorkspace(currentUser);
        showNotice(`已批量确认 ${result.confirmedCount} 条结算。`);
      } catch (error) {
        showError(error instanceof Error ? error.message : "批量确认结算失败");
      }
      return;
    }

    const pendingSettlements = settlements.filter((settlement) => uniqueIds.includes(settlement.id) && settlement.status === "pending");
    const frozenSettlement = pendingSettlements.find((settlement) => settlementTaskRiskFreezeStatus(settlement, riskCases).frozen);

    if (frozenSettlement) {
      showError(formatTaskRiskFreezeError(settlementTaskRiskFreezeStatus(frozenSettlement, riskCases)));
      return;
    }

    const lockedSettlement =
      false
        ? undefined
        : pendingSettlements.find((settlement) => settlementRiskLockError(settlement, settlementLockDays));

    if (lockedSettlement) {
      showError(settlementRiskLockError(lockedSettlement, settlementLockDays) ?? "所选结算仍在风控锁定期。");
      return;
    }

    const pendingIds = new Set(pendingSettlements.map((settlement) => settlement.id));
    const pendingTaskIds = new Set(pendingSettlements.map((settlement) => settlement.taskId));

    if (!pendingIds.size) {
      return;
    }

    const confirmedAt = new Date().toISOString();

    setSettlements((items) => items.map((item) => (pendingIds.has(item.id) ? { ...item, status: "confirmed", confirmedAt } : item)));
    setTasks((items) =>
      items.map((item) => (pendingTaskIds.has(item.id) ? { ...item, status: transitionTaskStatus(item.status, "settle") } : item)),
    );
    log(currentUser.displayName, `批量确认结算 ${pendingIds.size} 条`, "settlements");
    showNotice(`已批量确认 ${pendingIds.size} 条结算。`);
  }

  async function lockSettlementRiskDeduction(settlementId: string, input: LockSettlementRiskDeductionInput) {
    if (!currentUser || currentUser.role !== "finance") {
      return;
    }

    if (apiMode) {
      try {
        await apiLockSettlementRiskDeduction(settlementId, input);
        await reloadApiWorkspace(currentUser);
        showNotice("扣罚资金流向已锁定。");
      } catch (error) {
        showError(error instanceof Error ? error.message : "锁定扣罚资金流向失败");
      }
      return;
    }

    const settlement = settlements.find((item) => item.id === settlementId);
    const taskFreezeStatus = settlement ? settlementTaskRiskFreezeStatus(settlement, riskCases) : undefined;
    const candidate = taskFreezeStatus?.deductionLockCandidate;
    const riskCase = riskCases.find((item) => item.id === (input.riskCaseId ?? candidate?.riskCaseId));

    if (!settlement || !riskCase) {
      showError("未找到可锁定的扣减裁决工单。");
      return;
    }

    const permission = canLockSettlementRiskDeduction({
      deductionBasisPoints: riskCase.committeeDeductionBasisPoints,
      existingLockedAt: settlement.riskDeductionLockedAt,
      riskCaseDecision: riskCase.committeeDecision,
      riskCaseStatus: riskCase.status,
      settlementStatus: settlement.status,
    });

    if (!permission.allowed) {
      showError(permission.reason ?? "当前结算不能锁定扣罚资金流向");
      return;
    }

    const destination = input.destination ?? "risk_reserve";
    const note = input.note?.trim() ?? "";
    const lockedAt = new Date().toISOString();
    const basisPoints = Number(riskCase.committeeDeductionBasisPoints);
    const task = tasks.find((item) => item.id === settlement.taskId);
    const lawyer = usersById.get(settlement.lawyerId);
    const { deductionAmountCents, payableAmountCents } = calculateSettlementRiskDeduction(
      settlement.settlementAmountCents,
      basisPoints,
    );

    setSettlements((items) =>
      items.map((item) =>
        item.id === settlementId
          ? {
              ...item,
              lockedRiskDeductionBasisPoints: basisPoints,
              payableAmountCents,
              riskDeductionAmountCents: deductionAmountCents,
              riskDeductionCaseId: riskCase.id,
              riskDeductionLockedAt: lockedAt,
              riskDeductionNote: note,
              riskPenaltyDestination: destination,
            }
          : item,
      ),
    );
    setRiskCases((items) =>
      items.map((item) =>
        item.id === riskCase.id
          ? {
              ...item,
              ownerName: currentUser.displayName,
              ownerUserId: currentUser.id,
              resolutionNote: `扣罚资金流向已锁定：扣减 ${formatMoney(deductionAmountCents)}，律师实付 ${formatMoney(payableAmountCents)}，去向 ${riskPenaltyDestinationLabel(destination)}${note ? `；说明：${note}` : ""}`,
              resolvedAt: lockedAt,
              status: "resolved",
              updatedAt: nowText(),
            }
          : item,
      ),
    );
    if (deductionAmountCents > 0) {
      setFundTransactions((items) => [
        createRiskDeductionFundTransaction({
          id: `f-${Date.now()}`,
          amountCents: deductionAmountCents,
          createdAt: lockedAt,
          createdByName: currentUser.displayName,
          destination,
          lawyerName: lawyer?.displayName ?? settlement.lawyerName,
          note,
          riskCaseId: riskCase.id,
          riskCaseTitle: riskCase.title,
          settlementId,
          taskId: settlement.taskId,
          taskTitle: task?.title ?? settlement.taskTitle,
        }),
        ...items,
      ]);
    }
    log(
      currentUser.displayName,
      `锁定扣罚资金流向 ${formatMoney(deductionAmountCents)} -> ${riskPenaltyDestinationLabel(destination)}`,
      "settlements",
      "settlements.lock_risk_deduction",
    );
    log(
      "系统",
      `扣罚入账 ${formatMoney(deductionAmountCents)} -> ${riskPenaltyDestinationLabel(destination)}`,
      "funds",
      "funds.risk_deduction_posted",
    );
    showNotice("扣罚资金流向已锁定，结算金额已改为扣后实付。");
  }

  async function updateSystemSettings(settings: Array<{ key: string; value: SystemSettingValue }>) {
    if (!currentUser || !isSystemConfigRole(currentUser.role)) {
      return;
    }

    if (apiMode) {
      try {
        const nextSettings = await apiUpdateSystemSettings(settings);

        setSystemSettings(nextSettings);
        showNotice("系统参数已保存。");
      } catch (error) {
        showError(error instanceof Error ? error.message : "保存系统参数失败");
      }
      return;
    }

    setSystemSettings((items) =>
      items.map((item) => {
        const next = settings.find((setting) => setting.key === item.key);

        return next ? { ...item, updatedAt: nowText(), value: next.value } : item;
      }),
    );
    log(currentUser.displayName, "更新系统参数", "system_settings");
    showNotice("系统参数已保存。");
  }

  if (isBootstrapping) {
    return <LoadingScreen apiMode={apiMode} />;
  }

  if (pendingPasswordUser) {
    return (
      <PasswordChangeScreen
        apiMode={apiMode}
        user={pendingPasswordUser}
        onChangePassword={handleChangePassword}
        onCancel={logout}
      />
    );
  }

  if (!currentUser) {
    return <LoginScreen apiMode={apiMode} initialError={appError} users={users} onLogin={handleLogin} />;
  }

  const allowedNav = navItems.filter((item) => canAccessMenu(currentUser.role, item.key));
  const visibleNav = allowedNav.some((item) => item.key === activeNav) ? activeNav : getDefaultMenuKey(currentUser.role);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <a className="skip-link focus-ring" href="#main-content">
        跳到主内容
      </a>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[232px] border-r border-slate-950 bg-navy text-white shadow-[8px_0_28px_rgba(15,23,42,0.18)] xl:block">
        <div className="flex h-14 items-center gap-3 border-b border-white/10 px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-navy shadow-lift">
            <Gavel className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[17px] font-semibold leading-5 tracking-normal">Lexos</div>
            <div className="text-[11px] text-white/56">律所协作与结算中枢</div>
          </div>
        </div>
        <nav aria-label="主导航" className="space-y-1 px-2.5 py-3">
          {allowedNav.map((item) => {
            const Icon = item.icon;
            const active = item.key === visibleNav;
            return (
              <button
                aria-current={active ? "page" : undefined}
                className={`focus-ring flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition ${
                  active
                    ? "bg-white text-navy shadow-soft"
                    : "text-white/68 hover:bg-white/8 hover:text-white"
                }`}
                key={item.key}
                onClick={() => setActiveNav(item.key)}
                type="button"
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-md ${active ? "bg-teal/10" : "bg-white/[0.04]"}`}>
                  <Icon className={`h-4 w-4 ${active ? "text-teal" : "text-white/52"}`} />
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4">
          <div className="rounded-md border border-white/10 bg-white/[0.05] p-3">
            <div className="flex items-center gap-2 text-[11px] text-white/52">
              <ShieldCheck className="h-3.5 w-3.5" />
              当前权限
            </div>
            <div className="mt-2 text-sm font-semibold">{roleLabels[currentUser.role]}</div>
            <div className="mt-1 text-[11px] text-white/48">真实 API / RLS 加固</div>
          </div>
        </div>
      </aside>

      <main className="xl:pl-[232px]" id="main-content">
        <TopBar
          activeLabel={navItems.find((item) => item.key === visibleNav)?.label ?? "工作台"}
          apiMode={apiMode}
          user={currentUser}
          onLogout={logout}
        />
        <MobileNav activeKey={visibleNav} items={allowedNav} onSelect={setActiveNav} />
        <div className="mx-auto max-w-[1600px] px-3 py-3 sm:px-4 lg:px-5">
          {appError ? <InlineError className="mb-4" text={appError} /> : null}
          {appNotice ? (
            <div
              aria-live="polite"
              className="mb-4 flex items-center justify-between gap-3 rounded-md border border-teal/20 bg-teal/10 px-4 py-3 text-sm text-teal"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>{appNotice}</span>
              </div>
              <button
                aria-label="关闭提示"
                className="focus-ring flex h-11 w-11 items-center justify-center rounded-md text-teal transition hover:bg-white/70"
                onClick={() => setAppNotice(null)}
                type="button"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}
          {visibleNav === "dashboard" ? (
            <Dashboard
              currentUser={currentUser}
              customerAutoConfirmDays={customerAutoConfirmDays}
              customers={customers}
              feedback={feedback}
              onAutoConfirmOverdue={
                isDirectorRole(currentUser.role) ? autoConfirmOverdueTasks : undefined
              }
              onResetDemo={apiMode ? undefined : resetDemoWorkspace}
              ranks={ranks}
              riskCases={riskCases}
              settlements={settlements}
              tasks={tasks}
              users={users}
            />
          ) : null}
          {visibleNav === "users" ? (
            <UsersPage
              apiMode={apiMode}
              currentUser={currentUser}
              onAddUser={addUser}
              onUpdateUser={updateUser}
              ranks={ranks}
              refreshKey={workspaceVersion}
              users={users}
            />
          ) : null}
          {visibleNav === "ranks" ? <RanksPage ranks={ranks} /> : null}
          {visibleNav === "customers" ? (
            <CustomersPage apiMode={apiMode} customers={customers} onAddCustomer={addCustomer} refreshKey={workspaceVersion} />
          ) : null}
          {visibleNav === "market" ? (
            <MarketPage
              apiMode={apiMode}
              claimRestriction={buildUserClaimRiskRestriction(currentUser.id, tasks, riskCases)}
              currentUser={currentUser}
              onClaimTask={claimTask}
              portalTokensByTaskId={portalTokensByTaskId}
              rankByCode={rankByCode}
              ranks={ranks}
              refreshKey={workspaceVersion}
              tasks={tasks}
            />
          ) : null}
          {visibleNav === "my-tasks" ? (
            <MyTasksPage
              apiMode={apiMode}
              currentUser={currentUser}
              customersById={customersById}
              onAddTask={addTask}
              onApproveTask={approveTask}
              onReviewTask={reviewTask}
              onSubmitTask={submitTask}
              portalTokensByTaskId={portalTokensByTaskId}
              ranks={ranks}
              refreshKey={workspaceVersion}
              settlements={settlements}
              tasks={tasks}
              usersById={usersById}
            />
          ) : null}
          {visibleNav === "settlements" ? (
            <SettlementsPage
              apiMode={apiMode}
              currentUser={currentUser}
              onConfirmSettlements={confirmSettlementBatch}
              onConfirmSettlement={confirmSettlement}
              onLockSettlementRiskDeduction={lockSettlementRiskDeduction}
              ranks={ranks}
              refreshKey={workspaceVersion}
              riskCases={riskCases}
              riskDeductionRates={riskDeductionRates}
              settlements={settlements}
              settlementLockDays={settlementLockDays}
              tasks={tasks}
              usersById={usersById}
            />
          ) : null}
          {visibleNav === "funds" ? (
            <FundsPage apiMode={apiMode} fundTransactions={fundTransactions} refreshKey={workspaceVersion} />
          ) : null}
          {visibleNav === "risk" ? (
            <RiskCasesPage
              apiMode={apiMode}
              currentUser={currentUser}
              customersById={customersById}
              onCreateRiskCase={createRiskCase}
              onSubmitRiskCaseDecision={submitRiskCaseDecision}
              onSubmitRiskCaseDefense={submitRiskCaseDefense}
              onUpdateRiskCaseStatus={updateRiskCaseStatus}
              refreshKey={workspaceVersion}
              riskCases={riskCases}
              riskDeductionRates={riskDeductionRates}
              tasks={tasks}
              usersById={usersById}
            />
          ) : null}
          {visibleNav === "audit" ? <AuditPage apiMode={apiMode} logs={auditLogs} refreshKey={workspaceVersion} /> : null}
          {visibleNav === "settings" ? <SettingsPage onSave={updateSystemSettings} settings={systemSettings} /> : null}
          {visibleNav === "permissions" ? <PermissionsPage /> : null}
          {visibleNav === "dashboard" ? (
            apiMode ? (
              <ApiPortalPage
                onAfterFeedback={async () => {
                  await reloadApiWorkspace(currentUser);
                }}
              />
            ) : (
              <PortalPage
                customersById={customersById}
                feedback={feedback}
                onConfirmDelivery={confirmCustomerDelivery}
                tasks={tasks}
              />
            )
          ) : null}
        </div>
      </main>
    </div>
  );
}

function LoadingScreen({ apiMode }: { apiMode: boolean }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-md rounded-md border border-line bg-white p-7 text-center shadow-soft">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-ink text-white">
          <Gavel className="h-5 w-5" />
        </div>
        <h1 className="mt-5 text-xl font-semibold">正在进入 Lexos</h1>
        <p className="mt-2 text-sm leading-6 text-slate">
          {apiMode ? "正在检查 Supabase 会话并加载律所工作台数据。" : "正在加载本地工作区数据。"}
        </p>
      </div>
    </main>
  );
}

function LoginScreen({
  apiMode,
  initialError,
  users,
  onLogin,
}: {
  apiMode: boolean;
  initialError: string | null;
  users: DemoUser[];
  onLogin: (username: string, password: string) => Promise<string | null>;
}) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState(apiMode ? "" : DEFAULT_INITIAL_PASSWORD);
  const [error, setError] = useState<string | null>(initialError);
  const [submitting, setSubmitting] = useState(false);
  const suggestedUsers = useMemo(() => {
    const byId = new Map(users.map((user) => [user.id, user]));

    return ["u-admin", "u-source", "u-handler", "u-finance", "u-source-2", "u-firm"]
      .map((id) => byId.get(id))
      .filter((user): user is DemoUser => Boolean(user));
  }, [users]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setError(await onLogin(username, password));
    setSubmitting(false);
  }

  return (
    <main className="grid min-h-screen bg-canvas lg:grid-cols-[minmax(0,1fr)_500px]">
      <section className="hidden min-h-screen bg-navy p-8 text-white lg:block">
        <div className="flex h-full flex-col justify-between border-l border-white/10 pl-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-navy shadow-lift">
              <Gavel className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold leading-5">Lexos</div>
              <div className="text-[12px] text-white/56">律所协作与结算中枢</div>
            </div>
          </div>
          <div className="max-w-2xl">
            <h1 className="text-[38px] font-semibold leading-tight tracking-normal">律所任务、交付与结算，放进同一套秩序。</h1>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-white/68">
              面向律所内部协作，从客户建档、任务发起、律师承办、客户确认到财务结算，形成可审计、可追踪的业务闭环。
            </p>
            <div className="mt-8 grid max-w-xl gap-2">
              {["律师发起任务与客户链接", "律师按职级承接并提交成果", "客户确认交付，财务完成结算"].map((item, index) => (
                <div className="flex min-h-11 items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[13px]" key={item}>
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-[12px] font-semibold text-navy">{index + 1}</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-[12px]">
            <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
              <div className="text-2xl font-semibold">9</div>
              <div className="mt-1 text-white/56">职级比例</div>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
              <div className="text-2xl font-semibold">RLS</div>
              <div className="mt-1 text-white/56">直连保护</div>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
              <div className="text-2xl font-semibold">Prod</div>
              <div className="mt-1 text-white/56">上线闭环</div>
            </div>
          </div>
        </div>
      </section>
      <section className="flex min-h-screen w-full items-center justify-center px-5 py-8">
        <form className="w-full max-w-sm rounded-md border border-line bg-white p-6 shadow-lift" onSubmit={submit}>
          <div className="mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-navy text-white lg:hidden">
              <Gavel className="h-4 w-4" />
            </div>
            <div className="mt-4 inline-flex h-7 items-center rounded-md border border-teal/20 bg-teal/10 px-2 text-[12px] font-semibold text-teal">
              {apiMode ? "真实 API 模式" : "本地工作区模式"}
            </div>
            <h2 className="mt-1 text-[24px] font-semibold leading-8">登录工作台</h2>
            <p className="mt-2 text-[13px] leading-5 text-steel">
              {apiMode
                ? "连接真实 Supabase 后，管理员请使用已设置的新密码登录。新用户首次登录仍会被要求修改默认密码。"
                : "默认账号密码均为 111111。首次登录后，系统会强制要求修改密码。"}
            </p>
          </div>
          <label className="block text-[12px] font-medium text-slate" htmlFor="username">
            用户名
          </label>
          <input
            autoComplete="username"
            className={lexosUi.input}
            id="username"
            onChange={(event) => setUsername(event.target.value)}
            value={username}
          />
          <label className="mt-4 block text-[12px] font-medium text-slate" htmlFor="password">
            密码
          </label>
          <input
            autoComplete="current-password"
            className={lexosUi.input}
            id="password"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
          />
          {error ? <div className="mt-3"><InlineError text={error} /></div> : null}
          <button
            className={actionButtonClass("primary", "md", "mt-5 w-full")}
            disabled={submitting}
            type="submit"
          >
            {submitting ? "登录中" : "进入 Lexos"}
          </button>
          {!apiMode ? (
            <div className="mt-5 border-t border-line pt-4">
              <div className="text-[12px] font-semibold text-slate">可试用账号</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[12px] text-slate">
                {suggestedUsers.map((user) => (
                  <button
                    className="focus-ring min-h-11 rounded-md border border-line px-2 py-2 text-left transition hover:border-teal hover:bg-canvas/70 hover:text-ink"
                    key={user.id}
                    onClick={() => {
                      setUsername(user.username);
                      setPassword(user.password);
                    }}
                    type="button"
                  >
                    <span className="block font-semibold text-ink">{user.username}</span>
                    {roleLabels[user.role]}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </form>
      </section>
    </main>
  );
}

function PasswordChangeScreen({
  apiMode,
  user,
  onCancel,
  onChangePassword,
}: {
  apiMode: boolean;
  user: DemoUser;
  onCancel: () => void | Promise<void>;
  onChangePassword: (userId: string, newPassword: string) => void | Promise<void>;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (newPassword.length < 6) {
      setError("新密码至少 6 位");
      return;
    }

    if (newPassword === DEFAULT_INITIAL_PASSWORD) {
      setError("新密码不能继续使用默认密码 111111");
      return;
    }

    try {
      setSubmitting(true);
      await onChangePassword(user.id, newPassword);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "修改密码失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <form className="w-full max-w-md rounded-md border border-line bg-white p-7 shadow-soft" onSubmit={submit}>
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-teal text-white">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold">首次登录需要修改密码</h1>
        <p className="mt-2 text-sm leading-6 text-slate">
          {user.displayName}，你的账号仍在使用默认密码。为了符合律所内部系统的基本安全要求，请先设置新密码。
          {apiMode ? " 修改成功后会继续加载真实工作台数据。" : ""}
        </p>
        <label className="mt-5 block text-sm font-medium" htmlFor="newPassword">
          新密码
        </label>
        <input
          autoComplete="new-password"
          className={`${lexosUi.input} mt-2`}
          id="newPassword"
          onChange={(event) => setNewPassword(event.target.value)}
          type="password"
          value={newPassword}
        />
        {error ? <div className="mt-3"><InlineError text={error} /></div> : null}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            className={actionButtonClass("primary", "md", "flex-1")}
            disabled={submitting}
            type="submit"
          >
            {submitting ? "修改中" : "修改并进入"}
          </button>
          <button className={actionButtonClass("secondary", "md", "flex-1")} onClick={onCancel} type="button">
            返回登录
          </button>
        </div>
      </form>
    </main>
  );
}

function TopBar({
  activeLabel,
  apiMode,
  user,
  onLogout,
}: {
  activeLabel: string;
  apiMode: boolean;
  user: DemoUser;
  onLogout: () => void | Promise<void>;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-paper/94 backdrop-blur">
      <div className="flex min-h-14 items-center justify-between gap-3 px-3 py-1.5 sm:px-4 lg:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-navy text-white xl:hidden">
            <Gavel className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[15px] font-semibold leading-5">{activeLabel}</div>
            <div className="mt-0.5 text-[12px] text-steel">Lexos 律所协作平台</div>
          </div>
          <div className="ml-3 hidden h-9 items-center gap-2 rounded-md border border-line bg-canvas px-2.5 text-[12px] text-steel md:flex">
            <ShieldCheck className="h-4 w-4 text-teal" />
            RLS 已启用 · 多角色协同
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden h-9 items-center rounded-md border border-line bg-canvas px-2.5 text-[12px] font-semibold text-slate md:flex">
            {apiMode ? "真实 API" : "本地工作区"}
          </div>
          <div className="hidden items-center gap-2 rounded-md border border-line bg-white px-2.5 py-1 sm:flex">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal/10 text-teal">
              <UserRound className="h-3.5 w-3.5" />
            </div>
            <div className="text-right">
              <div className="text-[12px] font-semibold leading-4">{user.displayName}</div>
              <div className="text-[11px] text-steel">{roleLabels[user.role]}</div>
            </div>
          </div>
          <button
            aria-label="退出登录"
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-md border border-line bg-white text-steel hover:border-steel/50 hover:text-ink"
            onClick={onLogout}
            type="button"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

function MobileNav({
  activeKey,
  items,
  onSelect,
}: {
  activeKey: NavKey;
  items: typeof navItems;
  onSelect: (key: NavKey) => void;
}) {
  return (
    <div className="border-b border-line bg-white xl:hidden">
      <div className="flex gap-2 overflow-x-auto px-3 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.key === activeKey;

          return (
            <button
              aria-current={active ? "page" : undefined}
              className={`focus-ring flex h-11 shrink-0 items-center gap-2 rounded-md px-3 text-[12px] font-semibold ${
                active ? "bg-navy text-white shadow-soft" : "border border-line bg-canvas text-slate"
              }`}
              key={item.key}
              onClick={() => onSelect(item.key)}
              type="button"
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Dashboard({
  currentUser,
  customerAutoConfirmDays,
  customers,
  feedback,
  onAutoConfirmOverdue,
  onResetDemo,
  ranks,
  riskCases,
  settlements,
  tasks,
  users,
}: {
  currentUser: DemoUser;
  customerAutoConfirmDays: number;
  customers: Customer[];
  feedback: CustomerFeedback[];
  onAutoConfirmOverdue?: () => MaybePromise<void>;
  onResetDemo?: () => void;
  ranks: Rank[];
  riskCases: RiskCase[];
  settlements: Settlement[];
  tasks: Task[];
  users: DemoUser[];
}) {
  const pendingSettlements = settlements.filter((item) => item.status === "pending");
  const openTasks = tasks.filter((item) => item.status === "open");
  const submittedTasks = tasks.filter((item) => item.status === "submitted");
  const approvedTasks = tasks.filter((item) => item.status === "approved");
  const confirmedAmount = settlements
    .filter((item) => item.status === "confirmed")
    .reduce((sum, item) => sum + item.settlementAmountCents, 0);
  const totalAmount = tasks.reduce((sum, task) => sum + task.amountCents, 0);
  const recentTasks = tasks.slice(0, 8);
  const channelStats = buildCustomerChannelStats({ customers, feedback, settlements, tasks });
  const channelSummary = summarizeCustomerChannelStats(channelStats);
  const topChannel = channelSummary.topChannel;
  const lawyerStats = buildLawyerPerformanceStats({ feedback, settlements, tasks, users });
  const lawyerSummary = summarizeLawyerPerformanceStats(lawyerStats);
  const topLawyer = lawyerSummary.topLawyer;
  const allRepeatDisciplineStats = buildRepeatDisciplineStats({ riskCases, tasks, users });
  const visibleRepeatDisciplineStats =
    isLawyerRole(currentUser.role)
      ? allRepeatDisciplineStats.filter((stat) => stat.lawyerId === currentUser.id)
      : allRepeatDisciplineStats;
  const repeatDisciplineSummary = summarizeRepeatDisciplineStats(visibleRepeatDisciplineStats);
  const personalWorkbench = buildPersonalWorkbench({ currentUser, feedback, settlements, tasks });
  const [isAutoConfirming, setIsAutoConfirming] = useState(false);
  const settlementTaskIds = new Set(settlements.map((settlement) => settlement.taskId));
  const overdueAutoConfirmTasks = approvedTasks.filter(
    (task) =>
      !settlementTaskIds.has(task.id) &&
      buildCustomerAutoConfirmStatus(task, customerAutoConfirmDays).due,
  );
  const openRiskCases = riskCases.filter((item) => item.status !== "resolved");
  const majorRiskCases = openRiskCases.filter((item) => item.severity === "critical" || item.severity === "high");

  async function handleAutoConfirmOverdue() {
    if (!onAutoConfirmOverdue) {
      return;
    }

    setIsAutoConfirming(true);

    try {
      await onAutoConfirmOverdue();
    } finally {
      setIsAutoConfirming(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        description="集中查看任务供给、交付验收、客户确认和结算资金状态。"
        title="律所协作总览"
      />
      {onResetDemo ? (
        <div className="flex flex-col gap-3 rounded-md border border-teal/20 bg-teal/10 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[13px] font-semibold text-teal">标准本地数据已加载</div>
            <div className="mt-1 text-[12px] text-steel">覆盖任务大厅、我的任务、客户确认页、结算和审计日志。</div>
          </div>
          <button
            className={actionButtonClass("tealSoft", "sm")}
            onClick={onResetDemo}
            type="button"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            重置本地数据
          </button>
        </div>
      ) : null}
      <div className="grid gap-3 lg:grid-cols-4">
        <OperationsCue label="待财务结算" value={`${pendingSettlements.length} 条`} detail="进入资金确认队列" tone="ink" />
        <OperationsCue label="客户待确认" value={`${approvedTasks.length} 条`} detail={`自动确认 ${overdueAutoConfirmTasks.length} 条`} tone="teal" />
        <OperationsCue label="开放任务" value={`${openTasks.length} 条`} detail={`待验收 ${submittedTasks.length} 条`} tone="gold" />
        <OperationsCue label="未结风控" value={`${openRiskCases.length} 条`} detail={`高/重大 ${majorRiskCases.length} 条`} tone="rose" />
      </div>
      <PersonalWorkbenchPanel summary={personalWorkbench} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <Metric icon={ClipboardList} label="任务总数" value={`${tasks.length}`} />
        <Metric icon={Clock3} label="待抢 / 待验收" value={`${openTasks.length}/${submittedTasks.length}`} />
        <Metric icon={BriefcaseBusiness} label="客户数量" value={`${customers.length}`} />
        <Metric icon={BriefcaseBusiness} label="渠道来源" value={`${channelSummary.channelCount}`} />
        <Metric icon={Banknote} label="任务总金额" value={formatMoney(totalAmount)} />
        <Metric icon={Banknote} label="已确认结算" value={formatMoney(confirmedAmount)} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.55fr_0.95fr]">
        <Panel title="任务流转">
          <DataTable
            headers={["任务", "状态", "金额", "最低职级", "截止"]}
            rows={recentTasks.map((task) => [
              task.title,
              statusLabels[task.status],
              formatMoney(task.amountCents),
              task.minRankCode,
              task.dueAt,
            ])}
          />
        </Panel>
        <Panel title="运营信号">
          <div>
            <Signal label="待确认结算" value={`${pendingSettlements.length} 条`} />
            <Signal label="客户待确认" value={`${approvedTasks.length} 条`} />
            <Signal label="逾期待处理" value={`${overdueAutoConfirmTasks.length} 条`} />
            <Signal label="风控待处理" value={`${openRiskCases.length} 条`} />
            <Signal label="重大/严重风险" value={`${majorRiskCases.length} 条`} />
            <Signal label="累犯惩戒建议" value={`${repeatDisciplineSummary.actionableLawyerCount} 人`} />
            <Signal label="客户评分" value={feedback.length ? `${feedback[0].score}/10` : "待采集"} />
            <Signal label="启用职级" value={`${ranks.length} 档`} />
            <Signal label="内部用户" value={`${users.length} 人`} />
          </div>
          {onAutoConfirmOverdue ? (
            <div className="mt-3 rounded-md border border-line bg-canvas/70 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                    <Clock3 className="h-3.5 w-3.5 text-teal" />
                    逾期视为交付
                  </div>
                  <div className="mt-1 text-[12px] text-steel">
                    规则 {customerAutoConfirmDays} 天 · 待处理 {overdueAutoConfirmTasks.length} 条
                  </div>
                </div>
                <button
                  className={actionButtonClass("primary", "sm")}
                  disabled={isAutoConfirming || customerAutoConfirmDays <= 0 || !overdueAutoConfirmTasks.length}
                  onClick={handleAutoConfirmOverdue}
                  type="button"
                >
                  {isAutoConfirming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  处理
                </button>
              </div>
            </div>
          ) : null}
        </Panel>
      </div>
      <Panel title="客户与渠道贡献">
        <div className="grid gap-4 xl:grid-cols-[1.45fr_0.8fr]">
          <DataTable
            emptyText="暂无客户来源统计。"
            headers={["来源", "客户", "有效任务", "确认率", "任务金额", "结算金额", "评分"]}
            rows={channelStats.map((stat) => [
              stat.source,
              `${stat.customerCount}`,
              `${stat.activeTaskCount}`,
              `${stat.confirmedTaskRate}%`,
              formatMoney(stat.taskAmountCents),
              formatMoney(stat.settlementAmountCents),
              stat.averageScore === null ? "待采集" : `${stat.averageScore}/10`,
            ])}
          />
          <div>
            <Signal label="最高任务金额来源" value={topChannel ? topChannel.source : "待采集"} />
            <Signal label="来源数量" value={`${channelSummary.channelCount} 个`} />
            <Signal label="有效任务" value={`${channelSummary.activeTaskCount} 个`} />
            <Signal label="客户已确认任务" value={`${channelSummary.confirmedTaskCount} 个`} />
            <Signal label="渠道任务金额" value={formatMoney(channelSummary.taskAmountCents)} />
            <Signal label="渠道结算金额" value={formatMoney(channelSummary.settlementAmountCents)} />
          </div>
        </div>
      </Panel>
      <Panel title="律师绩效">
        <div className="grid gap-4 xl:grid-cols-[1.45fr_0.8fr]">
          <DataTable
            emptyText="暂无律师绩效。"
            headers={["律师", "职级", "在办/完成", "客户/发起/结果", "近30单", "任务金额", "结算金额"]}
            rows={lawyerStats.map((stat) => [
              stat.lawyerName,
              stat.rankCode,
              `${stat.inProgressTaskCount}/${stat.completedTaskCount}`,
              `${formatOptionalScore(stat.averageScore ?? undefined)} / ${formatOptionalScore(stat.sourceReviewAverageScore ?? undefined)} / ${formatOptionalScore(stat.caseResultAverageScore ?? undefined)}`,
              stat.rollingAverageScore === null ? "待采集" : `${stat.rollingAverageScore}/10 (${stat.rollingTaskCount})`,
              formatMoney(stat.taskAmountCents),
              formatMoney(stat.settlementAmountCents),
            ])}
          />
          <div>
            <Signal label="绩效领先" value={topLawyer ? topLawyer.lawyerName : "待采集"} />
            <Signal label="有效律师" value={`${lawyerSummary.activeLawyerCount}/${lawyerSummary.lawyerCount} 人`} />
            <Signal label="客户平均评分" value={lawyerSummary.averageScore === null ? "待采集" : `${lawyerSummary.averageScore}/10`} />
            <Signal label="近30单评分" value={lawyerSummary.rollingAverageScore === null ? "待采集" : `${lawyerSummary.rollingAverageScore}/10`} />
            <Signal label="发起人平均评分" value={lawyerSummary.sourceReviewAverageScore === null ? "待采集" : `${lawyerSummary.sourceReviewAverageScore}/10`} />
            <Signal label="结果平均评分" value={lawyerSummary.caseResultAverageScore === null ? "待采集" : `${lawyerSummary.caseResultAverageScore}/10`} />
            <Signal label="在办任务" value={`${lawyerSummary.inProgressTaskCount} 个`} />
            <Signal label="已完成任务" value={`${lawyerSummary.completedTaskCount} 个`} />
            <Signal label="已确认结算" value={formatMoney(lawyerSummary.confirmedSettlementAmountCents)} />
          </div>
        </div>
      </Panel>
      <RepeatDisciplinePanel stats={visibleRepeatDisciplineStats} />
      <Panel title="任务状态分布">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {(["open", "claimed", "submitted", "approved", "settlement_pending", "settled"] as TaskStatus[]).map((status) => (
            <div className="rounded-md border border-line bg-canvas/60 p-3" key={status}>
              <div className="flex items-center justify-between">
                <StatusBadge status={status} />
                <span className="text-lg font-semibold">{tasks.filter((task) => task.status === status).length}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-teal"
                  style={{ width: `${tasks.length ? Math.max(8, (tasks.filter((task) => task.status === status).length / tasks.length) * 100) : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function RepeatDisciplinePanel({ stats }: { stats: RepeatDisciplineStat[] }) {
  const summary = summarizeRepeatDisciplineStats(stats);
  const actionableStats = stats.filter((stat) => stat.level !== "clear");
  const topStat = summary.topStat;

  return (
    <Panel title="累犯惩戒建议">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-md border border-line bg-canvas/70 p-3">
          <div className="text-[12px] font-medium text-steel">观察周期</div>
          <div className="mt-1 text-[20px] font-semibold leading-7 text-ink">{REPEAT_DISCIPLINE_LOOKBACK_DAYS} 天</div>
        </div>
        <div className="rounded-md border border-line bg-canvas/70 p-3">
          <div className="text-[12px] font-medium text-steel">需处理律师</div>
          <div className="mt-1 text-[20px] font-semibold leading-7 text-ink">{summary.actionableLawyerCount} 人</div>
        </div>
        <div className="rounded-md border border-line bg-canvas/70 p-3">
          <div className="text-[12px] font-medium text-steel">限制建议</div>
          <div className="mt-1 text-[20px] font-semibold leading-7 text-ink">{summary.restrictionCount} 人</div>
        </div>
        <div className="rounded-md border border-line bg-canvas/70 p-3">
          <div className="text-[12px] font-medium text-steel">升级复盘</div>
          <div className="mt-1 text-[20px] font-semibold leading-7 text-ink">{summary.escalationCount} 人</div>
        </div>
      </div>
      <div className="mt-3 rounded-md border border-line bg-white px-3 py-2 text-[12px] leading-5 text-steel">
        {topStat
          ? `当前重点关注：${topStat.lawyerName}，${repeatDisciplineLevelLabels[topStat.level]}，近 ${REPEAT_DISCIPLINE_LOOKBACK_DAYS} 天有效风控 ${topStat.effectiveCaseCount} 条。`
          : "当前没有达到累犯惩戒建议阈值的律师。"}
      </div>
      {actionableStats.length ? (
        <div className={`${lexosUi.tableWrap} mt-3`}>
          <table className={`${lexosUi.table} min-w-[1080px]`}>
            <thead className={lexosUi.tableHead}>
              <tr>
                <th className="px-3 py-2.5 font-semibold">律师</th>
                <th className="px-3 py-2.5 font-semibold">建议等级</th>
                <th className="px-3 py-2.5 font-semibold">有效风控</th>
                <th className="px-3 py-2.5 font-semibold">未办结</th>
                <th className="px-3 py-2.5 font-semibold">最近工单</th>
                <th className="px-3 py-2.5 font-semibold">建议动作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {actionableStats.map((stat) => (
                <tr className="align-top hover:bg-canvas/70" key={stat.lawyerId}>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <div className="font-semibold text-ink">{stat.lawyerName}</div>
                    <div className="mt-1 text-[12px] text-steel">{stat.rankCode}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-slate">{repeatDisciplineLevelLabels[stat.level]}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-slate">
                    {stat.effectiveCaseCount} 条
                    <span className="ml-2 text-[12px] text-steel">高/重大 {stat.highOrCriticalCaseCount}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-slate">{stat.activeCaseCount} 条</td>
                  <td className="max-w-72 px-3 py-2.5 text-slate">{repeatDisciplineRecentCasesText(stat)}</td>
                  <td className="max-w-96 px-3 py-2.5 leading-5 text-slate">{stat.suggestedAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-3">
          <EmptyState text={`近 ${REPEAT_DISCIPLINE_LOOKBACK_DAYS} 天暂无触发累犯惩戒建议的律师。`} />
        </div>
      )}
    </Panel>
  );
}

function repeatDisciplineRecentCasesText(stat: RepeatDisciplineStat): string {
  const cases = stat.recentCases.slice(0, 2).map((riskCase) => {
    const title = riskCase.taskTitle ?? riskCase.title;

    return `${title} · ${riskCaseSeverityLabels[riskCase.severity]}`;
  });

  return cases.length ? cases.join("；") : "-";
}

function PersonalWorkbenchPanel({ summary }: { summary: PersonalWorkbenchSummary }) {
  return (
    <section className="rounded-md border border-line bg-paper shadow-soft">
      <div className="grid gap-4 p-4 xl:grid-cols-[0.95fr_1.35fr]">
        <div className="flex flex-col justify-between gap-4">
          <div>
            <div className="text-[12px] font-semibold uppercase text-teal">个人工作台</div>
            <h2 className="mt-2 text-[18px] font-semibold leading-6 text-ink">{summary.title}</h2>
            <p className="mt-2 max-w-2xl text-[13px] leading-5 text-steel">{summary.subtitle}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {summary.metrics.map((metric) => (
              <div className="rounded-md border border-line bg-canvas/60 px-3 py-2.5" key={metric.label}>
                <div className="text-[11px] font-medium text-steel">{metric.label}</div>
                <div className="mt-1 truncate text-[16px] font-semibold leading-6 text-ink">{metric.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between border-b border-line pb-2">
            <div className="text-[13px] font-semibold text-ink">下一步动作</div>
            <div className="text-[11px] font-medium text-steel">按角色自动筛选</div>
          </div>
          {summary.actions.length ? (
            <div className="divide-y divide-line">
              {summary.actions.map((action) => (
                <div className="grid gap-2 py-3 sm:grid-cols-[1fr_auto] sm:items-center" key={action.id}>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-ink">{action.title}</div>
                    <div className="mt-1 truncate text-[12px] text-steel">{action.detail}</div>
                  </div>
                  {action.status ? <StatusBadge status={action.status} /> : <span className="text-[11px] font-semibold text-teal">待处理</span>}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8">
              <EmptyState text="当前没有需要立即处理的个人事项。" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function UsersPage({
  apiMode,
  currentUser,
  onAddUser,
  onUpdateUser,
  ranks,
  refreshKey,
  users,
}: {
  apiMode: boolean;
  currentUser: DemoUser;
  onAddUser: (input: { username: string; displayName: string; role: UserRole; rankCode?: string }) => MaybePromise<void>;
  onUpdateUser: (input: {
    rankCode?: string;
    role: UserRole;
    status: DemoUser["status"];
    userId: string;
  }) => MaybePromise<void>;
  ranks: Rank[];
  refreshKey: number;
  users: DemoUser[];
}) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("lawyer");
  const [rankCode, setRankCode] = useState("L1A");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<DemoUser["status"] | "all">("all");
  const [sort, setSort] = useState("createdAtDesc");
  const [page, setPage] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<UserRole>("lawyer");
  const [editingRankCode, setEditingRankCode] = useState("L1A");
  const [editingStatus, setEditingStatus] = useState<DemoUser["status"]>("active");
  const [confirmingStatusUserId, setConfirmingStatusUserId] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [serverUsers, setServerUsers] = useState<DemoUser[]>(users);
  const [serverPagination, setServerPagination] = useState<ApiPagination>(() =>
    fallbackPagination(1, TABLE_PAGE_SIZE, users.length),
  );
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const filteredUsers = users.filter((user) => {
    const firstLoginStatus = user.mustChangePassword ? "待首次改密" : "已改密";
    const accountStatus = userStatusLabels[user.status];

    return (
      (roleFilter === "all" || user.role === roleFilter) &&
      (statusFilter === "all" || user.status === statusFilter) &&
      matchesSearch(query, user.username, user.displayName, roleLabels[user.role], user.rankCode, firstLoginStatus, accountStatus)
    );
  });
  const sortedUsers = sortDemoItems(filteredUsers, sort, {
    createdAtAsc: { direction: "asc", select: (user) => user.id },
    createdAtDesc: { direction: "desc", select: (user) => user.id },
    roleAsc: { direction: "asc", select: (user) => user.role },
    statusAsc: { direction: "asc", select: (user) => user.status },
  });
  const userPage = paginateItems(sortedUsers, page);
  const visibleUsers = apiMode ? serverUsers : userPage.items;
  const visibleCurrentPage = apiMode ? serverPagination.page : userPage.currentPage;
  const visiblePageSize = apiMode ? serverPagination.pageSize : userPage.pageSize;
  const visibleTotal = apiMode ? serverPagination.total : userPage.total;
  const visibleTotalPages = apiMode ? serverPagination.totalPages : userPage.totalPages;

  useEffect(() => {
    setPage(1);
    setEditingUserId(null);
    setConfirmingStatusUserId(null);
  }, [query, roleFilter, sort, statusFilter]);

  useEffect(() => {
    if (!apiMode) {
      return;
    }

    let active = true;

    async function loadUsersPage() {
      setIsLoadingList(true);
      setListError(null);

      try {
        const result = await apiFetchUsersPage({
          page,
          pageSize: TABLE_PAGE_SIZE,
          role: roleFilter,
          search: query,
          sort,
          status: statusFilter,
        });

        if (!active) {
          return;
        }

        setServerUsers(result.items);
        setServerPagination(result.pagination);
      } catch (error) {
        if (active) {
          setListError(error instanceof Error ? error.message : "用户列表加载失败");
        }
      } finally {
        if (active) {
          setIsLoadingList(false);
        }
      }
    }

    void loadUsersPage();

    return () => {
      active = false;
    };
  }, [apiMode, page, query, refreshKey, roleFilter, sort, statusFilter]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);

    try {
      await onAddUser({ username, displayName, role, rankCode: isLawyerRole(role) ? rankCode : undefined });
      setUsername("");
      setDisplayName("");
    } finally {
      setIsCreating(false);
    }
  }

  function beginEdit(user: DemoUser) {
    setConfirmingStatusUserId(null);
    setEditingUserId(user.id);
    setEditingRole(user.role);
    setEditingRankCode(user.rankCode ?? ranks[0]?.code ?? "L1A");
    setEditingStatus(user.status);
  }

  async function saveEdit(userId: string) {
    setSavingUserId(userId);

    try {
      await onUpdateUser({
        rankCode: isLawyerRole(editingRole) ? editingRankCode : undefined,
        role: editingRole,
        status: editingStatus,
        userId,
      });
      setEditingUserId(null);
    } finally {
      setSavingUserId(null);
    }
  }

  async function toggleUserStatus(user: DemoUser) {
    setSavingUserId(user.id);

    try {
      await onUpdateUser({
        rankCode: isLawyerRole(user.role) ? user.rankCode ?? ranks[0]?.code : undefined,
        role: user.role,
        status: user.status === "active" ? "disabled" : "active",
        userId: user.id,
      });
      setConfirmingStatusUserId(null);
    } finally {
      setSavingUserId(null);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader description="新增用户默认密码为 111111，首次登录后强制修改。" title="用户管理" />
      <Panel title="创建用户">
        <form className="grid gap-3 md:grid-cols-5" onSubmit={submit}>
          <TextInput label="用户名" onChange={setUsername} value={username} />
          <TextInput label="姓名" onChange={setDisplayName} value={displayName} />
          <SelectInput
            label="角色"
            onChange={(value) => setRole(value as UserRole)}
            options={manageableUserRoleOptions}
            value={role}
          />
          <SelectInput
            disabled={!isLawyerRole(role)}
            label="职级"
            onChange={setRankCode}
            options={ranks.map((rank) => [rank.code, rank.code])}
            value={rankCode}
          />
          <div className="flex items-end">
            <button
              className={actionButtonClass("primary", "md", "w-full")}
              disabled={isCreating}
              type="submit"
            >
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {isCreating ? "创建中" : "新增"}
            </button>
          </div>
        </form>
      </Panel>
      <Panel title="用户列表">
        <ListToolbar
          onSearchChange={setQuery}
          resultText={isLoadingList ? "加载用户中..." : resultCountText(visibleTotal, "位用户", apiMode)}
          searchPlaceholder="搜索用户名、姓名、角色或职级"
          searchValue={query}
        >
          <ToolbarSelect
            ariaLabel="按角色筛选用户"
            onChange={(value) => setRoleFilter(value as UserRole | "all")}
            options={[["all", "全部角色"], ...manageableUserRoleOptions]}
            value={roleFilter}
          />
          <ToolbarSelect
            ariaLabel="按账号状态筛选用户"
            onChange={(value) => setStatusFilter(value as DemoUser["status"] | "all")}
            options={[["all", "全部状态"], ...userStatusOptions]}
            value={statusFilter}
          />
          <ToolbarSelect ariaLabel="用户排序" onChange={setSort} options={userSortOptions} value={sort} />
        </ListToolbar>
        {listError ? <InlineError text={listError} /> : null}
        {visibleUsers.length ? (
          <div className={lexosUi.tableWrap}>
            <table className={`${lexosUi.table} min-w-[980px]`}>
              <thead className={lexosUi.tableHead}>
                <tr>
                  <th className="px-3 py-2.5 font-semibold">用户名</th>
                  <th className="px-3 py-2.5 font-semibold">姓名</th>
                  <th className="px-3 py-2.5 font-semibold">角色</th>
                  <th className="px-3 py-2.5 font-semibold">职级</th>
                  <th className="px-3 py-2.5 font-semibold">账号</th>
                  <th className="px-3 py-2.5 font-semibold">首次登录</th>
                  <th className="px-3 py-2.5 font-semibold">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibleUsers.map((user) => {
                  const isEditing = editingUserId === user.id;
                  const isCurrentUser = user.id === currentUser.id;
                  const isSaving = savingUserId === user.id;

                  return (
                    <tr className="hover:bg-canvas/70" key={user.id}>
                      <td className="whitespace-nowrap px-3 py-2.5 font-medium">{user.username}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate">{user.displayName}</td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        {isEditing ? (
                          <select
                            aria-label={`调整 ${user.displayName} 角色`}
                            className={`${lexosUi.inputBare} w-36`}
                            onChange={(event) => setEditingRole(event.target.value as UserRole)}
                            value={editingRole}
                          >
                            {manageableUserRoleOptions.map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          roleLabels[user.role]
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        {isEditing ? (
                          <select
                            aria-label={`调整 ${user.displayName} 职级`}
                            className={`${lexosUi.inputBare} w-28`}
                            disabled={!isLawyerRole(editingRole)}
                            onChange={(event) => setEditingRankCode(event.target.value)}
                            value={editingRankCode}
                          >
                            {ranks.map((rank) => (
                              <option key={rank.code} value={rank.code}>
                                {rank.code}
                              </option>
                            ))}
                          </select>
                        ) : (
                          user.rankCode ?? "-"
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        {isEditing ? (
                          <select
                            aria-label={`调整 ${user.displayName} 账号状态`}
                            className={`${lexosUi.inputBare} w-24`}
                            onChange={(event) => setEditingStatus(event.target.value as DemoUser["status"])}
                            value={editingStatus}
                          >
                            {userStatusOptions.map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={user.status === "active" ? "font-medium text-teal" : "font-medium text-rose-700"}>
                            {userStatusLabels[user.status]}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate">
                        {user.mustChangePassword ? "待首次改密" : "已改密"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        {isCurrentUser ? (
                          <span className="text-[12px] font-medium text-steel">当前账号</span>
                        ) : isEditing ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              className={actionButtonClass("primary", "sm")}
                              disabled={isSaving}
                              onClick={() => saveEdit(user.id)}
                              type="button"
                            >
                              {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                              保存
                            </button>
                            <button
                              className={actionButtonClass("ghost", "sm")}
                              disabled={isSaving}
                              onClick={() => setEditingUserId(null)}
                              type="button"
                            >
                              取消
                            </button>
                          </div>
                        ) : confirmingStatusUserId === user.id ? (
                          <div className="inline-flex items-center gap-2 rounded-md border border-navy/15 bg-canvas px-2 py-1">
                            <span className="text-[12px] font-medium text-slate">
                              {user.status === "active" ? "确认停用？" : "确认启用？"}
                            </span>
                            <button
                              className={actionButtonClass("ghost", "sm")}
                              disabled={isSaving}
                              onClick={() => setConfirmingStatusUserId(null)}
                              type="button"
                            >
                              取消
                            </button>
                            <button
                              className={actionButtonClass("primary", "sm")}
                              disabled={isSaving}
                              onClick={() => toggleUserStatus(user)}
                              type="button"
                            >
                              {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                              确认
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            <button
                              className={actionButtonClass("primary", "sm")}
                              onClick={() => beginEdit(user)}
                              type="button"
                            >
                              编辑
                            </button>
                            <button
                              className={actionButtonClass("secondary", "sm")}
                              onClick={() => setConfirmingStatusUserId(user.id)}
                              type="button"
                            >
                              {user.status === "active" ? "停用" : "启用"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="没有匹配的用户。" />
        )}
        <Pagination
          currentPage={visibleCurrentPage}
          onPageChange={setPage}
          pageSize={visiblePageSize}
          total={visibleTotal}
          totalPages={visibleTotalPages}
        />
      </Panel>
    </div>
  );
}

function RanksPage({ ranks }: { ranks: Rank[] }) {
  return (
    <div className="space-y-4">
      <PageHeader description="第一版使用固定九档职级，后续可扩展审批与调整记录。" title="律师职级" />
      <Panel title="L1A 至 L3C 结算比例">
        <DataTable
          headers={["职级", "名称", "结算比例", "排序"]}
          rows={ranks.map((rank) => [rank.code, rank.name, formatBasisPoints(rank.settlementBasisPoints), `${rank.sortOrder}`])}
        />
      </Panel>
    </div>
  );
}

function CustomersPage({
  apiMode,
  customers,
  onAddCustomer,
  refreshKey,
}: {
  apiMode: boolean;
  customers: Customer[];
  onAddCustomer: (input: { name: string; contactName: string; phone: string; source: string }) => MaybePromise<void>;
  refreshKey: number;
}) {
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("13800000000");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("createdAtDesc");
  const [page, setPage] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [serverCustomers, setServerCustomers] = useState<Customer[]>(customers);
  const [serverPagination, setServerPagination] = useState<ApiPagination>(() =>
    fallbackPagination(1, TABLE_PAGE_SIZE, customers.length),
  );
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const filteredCustomers = customers.filter((customer) =>
    matchesSearch(query, customer.name, customer.contactName, customer.phone, customer.source),
  );
  const sortedCustomers = sortDemoItems(filteredCustomers, sort, {
    createdAtAsc: { direction: "asc", select: (customer) => customer.id },
    createdAtDesc: { direction: "desc", select: (customer) => customer.id },
    nameAsc: { direction: "asc", select: (customer) => customer.name },
    sourceAsc: { direction: "asc", select: (customer) => customer.source },
  });
  const customerPage = paginateItems(sortedCustomers, page);
  const visibleCustomers = apiMode ? serverCustomers : customerPage.items;
  const visibleCurrentPage = apiMode ? serverPagination.page : customerPage.currentPage;
  const visiblePageSize = apiMode ? serverPagination.pageSize : customerPage.pageSize;
  const visibleTotal = apiMode ? serverPagination.total : customerPage.total;
  const visibleTotalPages = apiMode ? serverPagination.totalPages : customerPage.totalPages;

  useEffect(() => {
    setPage(1);
  }, [query, sort]);

  useEffect(() => {
    if (!apiMode) {
      return;
    }

    let active = true;

    async function loadCustomersPage() {
      setIsLoadingList(true);
      setListError(null);

      try {
        const result = await apiFetchCustomersPage({
          page,
          pageSize: TABLE_PAGE_SIZE,
          search: query,
          sort,
        });

        if (!active) {
          return;
        }

        setServerCustomers(result.items);
        setServerPagination(result.pagination);
      } catch (error) {
        if (active) {
          setListError(error instanceof Error ? error.message : "客户列表加载失败");
        }
      } finally {
        if (active) {
          setIsLoadingList(false);
        }
      }
    }

    void loadCustomersPage();

    return () => {
      active = false;
    };
  }, [apiMode, page, query, refreshKey, sort]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);

    try {
      await onAddCustomer({ name, contactName, phone, source: "律师录入" });
      setName("");
      setContactName("");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader description="维护客户联系人、来源与任务关联，支撑律师个人客户池和主任全所视图。" title="客户管理" />
      <Panel title="新增客户">
        <form className="grid gap-3 md:grid-cols-4" onSubmit={submit}>
          <TextInput label="客户名称" onChange={setName} value={name} />
          <TextInput label="联系人" onChange={setContactName} value={contactName} />
          <TextInput label="手机号" onChange={setPhone} value={phone} />
          <div className="flex items-end">
            <button
              className={actionButtonClass("primary", "md", "w-full")}
              disabled={isCreating}
              type="submit"
            >
              {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {isCreating ? "保存中" : "保存客户"}
            </button>
          </div>
        </form>
      </Panel>
      <Panel title="客户列表">
        <ListToolbar
          onSearchChange={setQuery}
          resultText={isLoadingList ? "加载客户中..." : resultCountText(visibleTotal, "位客户", apiMode)}
          searchPlaceholder="搜索客户、联系人、手机号或来源"
          searchValue={query}
        >
          <ToolbarSelect ariaLabel="客户排序" onChange={setSort} options={customerSortOptions} value={sort} />
        </ListToolbar>
        {listError ? <InlineError text={listError} /> : null}
        <DataTable
          emptyText="没有匹配的客户。"
          headers={["客户", "联系人", "手机号", "来源"]}
          rows={visibleCustomers.map((customer) => [customer.name, customer.contactName, customer.phone, customer.source])}
        />
        <Pagination
          currentPage={visibleCurrentPage}
          onPageChange={setPage}
          pageSize={visiblePageSize}
          total={visibleTotal}
          totalPages={visibleTotalPages}
        />
      </Panel>
    </div>
  );
}

function buildUserClaimRiskRestriction(userId: string, tasks: Task[], riskCases: RiskCase[]): ClaimRiskRestriction {
  const assignedTaskIds = new Set(tasks.filter((task) => task.assignedLawyerId === userId).map((task) => task.id));

  return buildClaimRiskRestriction(
    riskCases
      .filter(
        (riskCase) =>
          riskCase.taskAssignedLawyerId === userId || (riskCase.taskId ? assignedTaskIds.has(riskCase.taskId) : false),
      )
      .map((riskCase) => ({
        id: riskCase.id,
        severity: riskCase.severity,
        status: riskCase.status,
        taskId: riskCase.taskId,
        taskTitle: riskCase.taskTitle,
        title: riskCase.title,
      })),
  );
}

function MarketPage({
  apiMode,
  claimRestriction,
  currentUser,
  onClaimTask,
  portalTokensByTaskId,
  rankByCode,
  ranks,
  refreshKey,
  tasks,
}: {
  apiMode: boolean;
  claimRestriction: ClaimRiskRestriction;
  currentUser: DemoUser;
  onClaimTask: (taskId: string) => MaybePromise<void>;
  portalTokensByTaskId: Record<string, string>;
  rankByCode: Map<string, Rank>;
  ranks: Rank[];
  refreshKey: number;
  tasks: Task[];
}) {
  const userRank = currentUser.rankCode ? rankByCode.get(currentUser.rankCode) : null;
  const openTasks = tasks.filter((task) => task.status === "open");
  const [query, setQuery] = useState("");
  const [rankFilter, setRankFilter] = useState("all");
  const [sort, setSort] = useState("createdAtDesc");
  const [page, setPage] = useState(1);
  const [claimingTaskId, setClaimingTaskId] = useState<string | null>(null);
  const [serverTasks, setServerTasks] = useState<Task[]>(openTasks);
  const [serverPagination, setServerPagination] = useState<ApiPagination>(() =>
    fallbackPagination(1, CARD_PAGE_SIZE, openTasks.length),
  );
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const filteredOpenTasks = openTasks.filter(
    (task) =>
      (rankFilter === "all" || task.minRankCode === rankFilter) &&
      matchesSearch(query, task.title, task.description, task.minRankCode, task.dueAt, formatMoney(task.amountCents)),
  );
  const sortedOpenTasks = sortDemoItems(filteredOpenTasks, sort, {
    amountDesc: { direction: "desc", select: (task) => task.amountCents },
    createdAtAsc: { direction: "asc", select: (task) => task.id },
    createdAtDesc: { direction: "desc", select: (task) => task.id },
    dueAtAsc: { direction: "asc", select: (task) => task.dueAt },
    statusAsc: { direction: "asc", select: (task) => task.status },
  });
  const taskPage = paginateItems(sortedOpenTasks, page, CARD_PAGE_SIZE);
  const visibleTasks = apiMode ? serverTasks : taskPage.items;
  const visibleCurrentPage = apiMode ? serverPagination.page : taskPage.currentPage;
  const visiblePageSize = apiMode ? serverPagination.pageSize : taskPage.pageSize;
  const visibleTotal = apiMode ? serverPagination.total : taskPage.total;
  const visibleTotalPages = apiMode ? serverPagination.totalPages : taskPage.totalPages;

  useEffect(() => {
    setPage(1);
  }, [query, rankFilter, sort]);

  useEffect(() => {
    if (!apiMode) {
      return;
    }

    let active = true;
    const rank = rankFilter === "all" ? undefined : ranks.find((item) => item.code === rankFilter);

    async function loadTasksPage() {
      setIsLoadingList(true);
      setListError(null);

      try {
        const result = await apiFetchTasksPage(ranks, portalTokensByTaskId, {
          minRankId: rank?.id,
          page,
          pageSize: CARD_PAGE_SIZE,
          search: query,
          sort,
          status: "open",
        });

        if (!active) {
          return;
        }

        setServerTasks(result.items);
        setServerPagination(result.pagination);
      } catch (error) {
        if (active) {
          setListError(error instanceof Error ? error.message : "任务大厅加载失败");
        }
      } finally {
        if (active) {
          setIsLoadingList(false);
        }
      }
    }

    void loadTasksPage();

    return () => {
      active = false;
    };
  }, [apiMode, page, portalTokensByTaskId, query, rankFilter, ranks, refreshKey, sort]);

  async function claim(taskId: string) {
    setClaimingTaskId(taskId);

    try {
      await onClaimTask(taskId);
    } finally {
      setClaimingTaskId(null);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader description="律师可承接开放任务；系统按最低职级、任务状态和未结严重风控限制进行校验。" title="任务大厅" />
      <Panel title="可抢任务">
        <ListToolbar
          onSearchChange={setQuery}
          resultText={isLoadingList ? "加载任务中..." : resultCountText(visibleTotal, "个开放任务", apiMode)}
          searchPlaceholder="搜索任务标题、说明、职级或金额"
          searchValue={query}
        >
          <ToolbarSelect
            ariaLabel="按最低职级筛选任务"
            onChange={setRankFilter}
            options={[["all", "全部职级"], ...Array.from(rankByCode.values()).map((rank) => [rank.code, rank.code] as [string, string])]}
            value={rankFilter}
          />
          <ToolbarSelect ariaLabel="任务排序" onChange={setSort} options={taskSortOptions} value={sort} />
        </ListToolbar>
        {claimRestriction.blocked ? <InlineError text={claimRestriction.reason ?? "存在未办结严重风控工单，暂不能抢新任务"} /> : null}
        {listError ? <InlineError text={listError} /> : null}
        <div className="space-y-3">
          {visibleTasks.map((task) => {
            const minRank = rankByCode.get(task.minRankCode);
            const isClaiming = claimingTaskId === task.id;
            const claimPermission =
              userRank && minRank
                ? canClaimTaskWithRestriction({
                    taskStatus: task.status,
                    userRole: currentUser.role,
                    lawyerRankOrder: userRank.sortOrder,
                    minRankOrder: minRank.sortOrder,
                    restriction: claimRestriction,
                  })
                : {
                    allowed: false,
                    reason: "当前用户缺少职级信息",
                  };
            const canClaim = claimPermission.allowed;
            const claimButtonText = claimRestriction.blocked ? "风控暂停" : "承接";

            return (
              <div className="grid gap-3 rounded-md border border-line bg-white px-3 py-3 md:grid-cols-[1fr_120px]" key={task.id}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-[14px] font-semibold">{task.title}</div>
                    <StatusBadge status={task.status} />
                  </div>
                  <div className="mt-1 line-clamp-2 text-[13px] leading-5 text-steel">{task.description}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-slate">
                    <span className="rounded-md border border-line bg-canvas px-2 py-0.5">金额 {formatMoney(task.amountCents)}</span>
                    <span className="rounded-md border border-line bg-canvas px-2 py-0.5">最低 {task.minRankCode}</span>
                    <span className="rounded-md border border-line bg-canvas px-2 py-0.5">截止 {task.dueAt}</span>
                  </div>
                </div>
                <button
                  className={actionButtonClass("teal", "sm", "self-center")}
                  disabled={!canClaim || isClaiming}
                  onClick={() => claim(task.id)}
                  title={claimPermission.reason}
                  type="button"
                >
                  {isClaiming ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      处理中
                    </span>
                  ) : (
                    claimButtonText
                  )}
                </button>
              </div>
            );
          })}
          {!visibleTasks.length ? <EmptyState text="暂无匹配的开放任务。" /> : null}
        </div>
        <Pagination
          currentPage={visibleCurrentPage}
          onPageChange={setPage}
          pageSize={visiblePageSize}
          total={visibleTotal}
          totalPages={visibleTotalPages}
        />
      </Panel>
    </div>
  );
}

function MyTasksPage({
  apiMode,
  currentUser,
  customersById,
  onAddTask,
  onApproveTask,
  onReviewTask,
  onSubmitTask,
  portalTokensByTaskId,
  ranks,
  refreshKey,
  settlements,
  tasks,
  usersById,
}: {
  apiMode: boolean;
  currentUser: DemoUser;
  customersById: Map<string, Customer>;
  onAddTask: (input: {
    customerId: string;
    title: string;
    description: string;
    taskType: string;
    amountCents: number;
    minRankCode: string;
    dueAt: string;
    reviewLawyerId?: string;
    reviewRequired?: boolean;
  }) => MaybePromise<void>;
  onApproveTask: (taskId: string, input: ApproveTaskInput) => MaybePromise<void>;
  onReviewTask: (taskId: string, input: ReviewTaskInput) => MaybePromise<void>;
  onSubmitTask: (taskId: string, input: SubmitTaskInput) => MaybePromise<void>;
  portalTokensByTaskId: Record<string, string>;
  ranks: Rank[];
  refreshKey: number;
  settlements: Settlement[];
  tasks: Task[];
  usersById: Map<string, DemoUser>;
}) {
  const ownedTasks = isDirectorRole(currentUser.role)
    ? tasks
    : isLawyerRole(currentUser.role)
    ? tasks.filter((task) => task.sourceLawyerId === currentUser.id || task.assignedLawyerId === currentUser.id)
    : [];
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [sort, setSort] = useState("createdAtDesc");
  const [page, setPage] = useState(1);
  const [serverTasks, setServerTasks] = useState<Task[]>(ownedTasks);
  const [serverPagination, setServerPagination] = useState<ApiPagination>(() =>
    fallbackPagination(1, CARD_PAGE_SIZE, ownedTasks.length),
  );
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const filteredTasks = ownedTasks.filter((task) => {
    const customer = customersById.get(task.customerId);
    const lawyer = task.assignedLawyerId ? usersById.get(task.assignedLawyerId) : undefined;

    return (
      (statusFilter === "all" || task.status === statusFilter) &&
      matchesSearch(
        query,
        task.title,
        task.description,
        task.taskType,
        task.minRankCode,
        task.dueAt,
        statusLabels[task.status],
        formatTaskReviewStatus(task),
        customer?.name,
        task.customerName,
        lawyer?.displayName,
      )
    );
  });
  const sortedTasks = sortDemoItems(filteredTasks, sort, {
    amountDesc: { direction: "desc", select: (task) => task.amountCents },
    createdAtAsc: { direction: "asc", select: (task) => task.id },
    createdAtDesc: { direction: "desc", select: (task) => task.id },
    dueAtAsc: { direction: "asc", select: (task) => task.dueAt },
    statusAsc: { direction: "asc", select: (task) => task.status },
  });
  const taskPage = paginateItems(sortedTasks, page, CARD_PAGE_SIZE);
  const visibleTasks = apiMode ? serverTasks : taskPage.items;
  const visibleCurrentPage = apiMode ? serverPagination.page : taskPage.currentPage;
  const visiblePageSize = apiMode ? serverPagination.pageSize : taskPage.pageSize;
  const visibleTotal = apiMode ? serverPagination.total : taskPage.total;
  const visibleTotalPages = apiMode ? serverPagination.totalPages : taskPage.totalPages;
  const settlementByTaskId = new Map(settlements.map((settlement) => [settlement.taskId, settlement]));

  useEffect(() => {
    setPage(1);
  }, [query, sort, statusFilter]);

  useEffect(() => {
    if (!apiMode) {
      return;
    }

    let active = true;

    async function loadTasksPage() {
      setIsLoadingList(true);
      setListError(null);

      try {
        const result = await apiFetchTasksPage(ranks, portalTokensByTaskId, {
          page,
          pageSize: CARD_PAGE_SIZE,
          search: query,
          scope: isLawyerRole(currentUser.role) ? "mine" : undefined,
          sort,
          status: statusFilter,
        });

        if (!active) {
          return;
        }

        setServerTasks(result.items);
        setServerPagination(result.pagination);
      } catch (error) {
        if (active) {
          setListError(error instanceof Error ? error.message : "任务列表加载失败");
        }
      } finally {
        if (active) {
          setIsLoadingList(false);
        }
      }
    }

    void loadTasksPage();

    return () => {
      active = false;
    };
  }, [apiMode, currentUser.role, page, portalTokensByTaskId, query, ranks, refreshKey, sort, statusFilter]);

  return (
    <div className="space-y-4">
      <PageHeader description="律师在这里发起任务、提交成果和验收本人发起的任务；主任查看全所任务流转。" title="任务工作台" />
      {isLawyerRole(currentUser.role) ? (
        <CreateTaskPanel customersById={customersById} onAddTask={onAddTask} ranks={ranks} />
      ) : null}
      <Panel title="任务列表">
        <ListToolbar
          onSearchChange={setQuery}
          resultText={isLoadingList ? "加载任务中..." : resultCountText(visibleTotal, "个任务", apiMode)}
          searchPlaceholder="搜索任务、客户、状态、职级或律师"
          searchValue={query}
        >
          <ToolbarSelect
            ariaLabel="按任务状态筛选"
            onChange={(value) => setStatusFilter(value as TaskStatus | "all")}
            options={[
              ["all", "全部状态"],
              ...Object.entries(statusLabels).map(([value, label]) => [value, label] as [string, string]),
            ]}
            value={statusFilter}
          />
          <ToolbarSelect ariaLabel="任务排序" onChange={setSort} options={taskSortOptions} value={sort} />
        </ListToolbar>
        {listError ? <InlineError text={listError} /> : null}
        <div className="space-y-3">
          {visibleTasks.map((task) => (
            <TaskRow
              currentUser={currentUser}
              customer={customersById.get(task.customerId)}
              key={task.id}
              onApproveTask={onApproveTask}
              onReviewTask={onReviewTask}
              onSubmitTask={onSubmitTask}
              settlement={settlementByTaskId.get(task.id)}
              task={task}
              user={task.assignedLawyerId ? usersById.get(task.assignedLawyerId) : undefined}
            />
          ))}
          {!visibleTasks.length ? <EmptyState text="没有匹配的任务。" /> : null}
        </div>
        <Pagination
          currentPage={visibleCurrentPage}
          onPageChange={setPage}
          pageSize={visiblePageSize}
          total={visibleTotal}
          totalPages={visibleTotalPages}
        />
      </Panel>
    </div>
  );
}

function CreateTaskPanel({
  customersById,
  onAddTask,
  ranks,
}: {
  customersById: Map<string, Customer>;
  onAddTask: (input: {
    customerId: string;
    title: string;
    description: string;
    taskType: string;
    amountCents: number;
    minRankCode: string;
    dueAt: string;
    reviewLawyerId?: string;
    reviewRequired?: boolean;
  }) => MaybePromise<void>;
  ranks: Rank[];
}) {
  const customers = Array.from(customersById.values());
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [title, setTitle] = useState("民商事一审代理材料准备");
  const [description, setDescription] = useState("完成一审起诉材料、证据目录和立案前审查。");
  const [amount, setAmount] = useState("12000");
  const [minRankCode, setMinRankCode] = useState("L2A");
  const [dueAt, setDueAt] = useState("2026-07-01");
  const [reviewRequired, setReviewRequired] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!customerId) {
      return;
    }

    setIsPublishing(true);

    try {
      await onAddTask({
        customerId,
        title,
        description,
        taskType: "诉讼任务",
        amountCents: Math.round(Number(amount) * 100),
        minRankCode,
        reviewRequired,
        dueAt,
      });
    } finally {
      setIsPublishing(false);
    }
  }

  if (!customers.length) {
    return (
      <Panel title="发布任务">
        <EmptyState title="需要先创建客户" text="任务必须关联客户。请先在客户管理中新增客户，再回到这里发布任务。" />
      </Panel>
    );
  }

  return (
    <Panel title="发布任务">
      <form className="grid gap-3 lg:grid-cols-6" onSubmit={submit}>
        <SelectInput
          label="客户"
          onChange={setCustomerId}
          options={customers.map((customer) => [customer.id, customer.name])}
          value={customerId}
        />
        <TextInput label="任务标题" onChange={setTitle} value={title} />
        <TextInput label="任务说明" onChange={setDescription} value={description} />
        <TextInput label="金额（元）" onChange={setAmount} value={amount} />
        <SelectInput
          label="最低职级"
          onChange={setMinRankCode}
          options={ranks.map((rank) => [rank.code, rank.code])}
          value={minRankCode}
        />
        <TextInput label="截止日期" onChange={setDueAt} value={dueAt} />
        <label className="flex min-h-11 items-center gap-2 rounded-md border border-line bg-canvas/60 px-3 text-[13px] text-slate">
          <input
            checked={reviewRequired}
            className="h-4 w-4 accent-teal"
            onChange={(event) => setReviewRequired(event.target.checked)}
            type="checkbox"
          />
          需要主任复核
        </label>
        <div className="lg:col-span-6">
          <button
            className={actionButtonClass("primary")}
            disabled={isPublishing}
            type="submit"
          >
            {isPublishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {isPublishing ? "发布中" : "发布到任务大厅"}
          </button>
        </div>
      </form>
    </Panel>
  );
}

function TaskRow({
  currentUser,
  customer,
  onApproveTask,
  onReviewTask,
  onSubmitTask,
  settlement,
  task,
  user,
}: {
  currentUser: DemoUser;
  customer?: Customer;
  onApproveTask: (taskId: string, input: ApproveTaskInput) => MaybePromise<void>;
  onReviewTask: (taskId: string, input: ReviewTaskInput) => MaybePromise<void>;
  onSubmitTask: (taskId: string, input: SubmitTaskInput) => MaybePromise<void>;
  settlement?: Settlement;
  task: Task;
  user?: DemoUser;
}) {
  const [title, setTitle] = useState("阶段成果提交");
  const [content, setContent] = useState("已完成材料整理，交付文件链接如下。");
  const [externalUrl, setExternalUrl] = useState("https://example.com/deliverable");
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);
  const [sourceReviewScore, setSourceReviewScore] = useState("9");
  const [sourceReviewComment, setSourceReviewComment] = useState("成果结构完整，风险提示清晰。");
  const [caseResultScore, setCaseResultScore] = useState("8");
  const [caseResultSummary, setCaseResultSummary] = useState("交付结果满足当前客户沟通和推进需要。");
  const [reviewComment, setReviewComment] = useState("材料完整，法律风险提示清楚，可进入发起人验收。");
  const [expanded, setExpanded] = useState(task.status !== "open");
  const [confirmingApprove, setConfirmingApprove] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canApprove =
    isLawyerRole(currentUser.role) &&
    task.sourceLawyerId === currentUser.id &&
    task.status === "submitted" &&
    isTaskReviewSatisfied({ reviewRequired: task.reviewRequired, reviewStatus: task.reviewStatus });
  const canReview = canReviewTask({
    currentUserId: currentUser.id,
    reviewLawyerId: task.reviewLawyerId,
    reviewRequired: task.reviewRequired,
    reviewStatus: task.reviewStatus,
    taskStatus: task.status,
    userRole: currentUser.role,
  });
  const canSubmit = isLawyerRole(currentUser.role) && task.assignedLawyerId === currentUser.id && task.status === "claimed";
  const milestones = buildTaskMilestones(task, settlement);
  const milestoneSummary = summarizeTaskMilestones(milestones);
  const deliveryRecords = buildTaskDeliveryRecords(task);

  async function approve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsApproving(true);

    try {
      await onApproveTask(task.id, {
        caseResultScore: Number(caseResultScore),
        caseResultSummary,
        sourceReviewComment,
        sourceReviewScore: Number(sourceReviewScore),
      });
      setConfirmingApprove(false);
    } finally {
      setIsApproving(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFileError(null);

    if (file && file.size > MAX_DELIVERABLE_FILE_BYTES) {
      setFileError("附件不能超过 6MB");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmitTask(task.id, { title, content, externalUrl, file });
      setFile(null);
      setFileInputKey((value) => value + 1);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function review(decision: TaskReviewDecision) {
    setIsReviewing(true);

    try {
      await onReviewTask(task.id, { comment: reviewComment, decision });
    } finally {
      setIsReviewing(false);
    }
  }

  return (
    <div className="rounded-md border border-line bg-paper p-4 shadow-soft transition hover:border-steel/40">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[14px] font-semibold">{task.title}</div>
            <StatusBadge status={task.status} />
            {task.reviewRequired ? (
              <span className="inline-flex rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                {formatTaskReviewStatus(task)}
              </span>
            ) : null}
          </div>
          <div className="mt-1 text-[13px] leading-5 text-steel">{task.description}</div>
          <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-slate">
            <span className="inline-flex min-h-7 items-center rounded-md border border-line bg-canvas px-2.5">客户 {customer?.name ?? task.customerName ?? "-"}</span>
            <span className="inline-flex min-h-7 items-center rounded-md border border-line bg-canvas px-2.5">承办 {user?.displayName ?? "待承接"}</span>
            <span className="inline-flex min-h-7 items-center rounded-md border border-line bg-canvas px-2.5">金额 {formatMoney(task.amountCents)}</span>
            <span className="inline-flex min-h-7 items-center rounded-md border border-line bg-canvas px-2.5">
              客户链接 {task.portalToken || "创建任务时显示"}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <button
            className={actionButtonClass("secondary", "sm")}
            onClick={() => setExpanded((value) => !value)}
            type="button"
          >
            详情
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
          {canApprove && !confirmingApprove ? (
            <button
              className={actionButtonClass("teal", "sm")}
              onClick={() => setConfirmingApprove(true)}
              type="button"
            >
              验收通过
            </button>
          ) : null}
        </div>
      </div>
      {canReview ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50/80 p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <TextInput label="审核意见" onChange={setReviewComment} value={reviewComment} />
            <div className="flex flex-wrap gap-2">
              <button
                className={actionButtonClass("secondary", "sm")}
                disabled={isReviewing}
                onClick={() => void review("changes_requested")}
                type="button"
              >
                退回修改
              </button>
              <button
                className={actionButtonClass("primary", "sm")}
                disabled={isReviewing}
                onClick={() => void review("approved")}
                type="button"
              >
                {isReviewing ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                审核通过
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {canApprove && confirmingApprove ? (
        <form className="mt-4 rounded-md border border-teal/20 bg-teal/10 p-4" onSubmit={approve}>
          <div className="grid gap-3 md:grid-cols-4">
            <ScoreSelect label="发起人评分" onChange={setSourceReviewScore} value={sourceReviewScore} />
            <ScoreSelect label="案件结果评分" onChange={setCaseResultScore} value={caseResultScore} />
            <TextInput label="发起人评语" onChange={setSourceReviewComment} value={sourceReviewComment} />
            <TextInput label="结果摘要" onChange={setCaseResultSummary} value={caseResultSummary} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              className={actionButtonClass("ghost", "sm")}
              disabled={isApproving}
              onClick={() => setConfirmingApprove(false)}
              type="button"
            >
              取消
            </button>
            <button
              className={actionButtonClass("teal", "sm")}
              disabled={isApproving}
              type="submit"
            >
              {isApproving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              确认验收并评分
            </button>
          </div>
        </form>
      ) : null}
      {expanded ? (
        <div className="mt-4 border-t border-line pt-4">
          <TaskProgress milestones={milestones} />
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <DetailItem label="客户" value={customer?.name ?? task.customerName ?? "-"} />
            <DetailItem label="承办律师" value={user?.displayName ?? "待承接"} />
            <DetailItem label="任务类型" value={task.taskType} />
            <DetailItem label="最低职级" value={task.minRankCode} />
            <DetailItem label="任务金额" value={formatMoney(task.amountCents)} />
            <DetailItem label="截止日期" value={task.dueAt} />
            <DetailItem label="里程碑" value={`${milestoneSummary.completedCount}/${milestoneSummary.totalCount}`} />
            <DetailItem label="下一步" value={milestoneSummary.nextMilestone?.label ?? "流程完成"} />
            <DetailItem label="审核状态" value={formatTaskReviewStatus(task)} />
            <DetailItem label="审核时间" value={task.reviewedAt ?? "-"} />
            <DetailItem label="客户 token" value={task.portalToken || "创建任务时显示"} />
            <DetailItem label="验收时间" value={task.approvedAt ?? "-"} />
            <DetailItem label="发起人评分" value={formatOptionalScore(task.sourceReviewScore)} />
            <DetailItem label="案件结果评分" value={formatOptionalScore(task.caseResultScore)} />
          </div>
          {task.reviewComment || task.sourceReviewComment || task.caseResultSummary ? (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {task.reviewComment ? <DetailItem label="审核意见" value={task.reviewComment} /> : null}
              <DetailItem label="发起人评语" value={task.sourceReviewComment ?? "-"} />
              <DetailItem label="结果摘要" value={task.caseResultSummary ?? "-"} />
            </div>
          ) : null}
          <div className="mt-3 grid gap-3 xl:grid-cols-[1.25fr_0.75fr]">
            <TaskTimeline milestones={milestones} />
            <TaskSettlementCard settlement={settlement} task={task} />
          </div>
          <TaskDeliveryRecordsCard records={deliveryRecords} />
        </div>
      ) : null}
      {canSubmit ? (
        <form className="mt-4 grid gap-3 rounded-md border border-line bg-white p-4 md:grid-cols-3" onSubmit={submit}>
          <TextInput label="成果标题" onChange={setTitle} value={title} />
          <TextInput label="成果说明" onChange={setContent} value={content} />
          <TextInput label="外部链接" onChange={setExternalUrl} value={externalUrl} />
          <label className="md:col-span-3">
            <span className="text-xs font-medium text-steel">交付附件</span>
            <input
              key={fileInputKey}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
              className="sr-only"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0] ?? null;
                setFile(selectedFile);
                setFileError(selectedFile && selectedFile.size > MAX_DELIVERABLE_FILE_BYTES ? "附件不能超过 6MB" : null);
              }}
              type="file"
            />
            <span className="mt-1 flex min-h-12 cursor-pointer flex-col justify-center rounded-md border border-dashed border-line bg-canvas/60 px-3 py-2 text-[13px] text-slate hover:border-teal/40 hover:bg-teal/5 sm:flex-row sm:items-center sm:justify-between">
              <span className="inline-flex items-center gap-2">
                <Upload className="h-4 w-4 text-teal" />
                {file ? file.name : "选择 PDF、Word、Excel、图片或 ZIP 附件"}
              </span>
              <span className="mt-1 text-[11px] text-steel sm:mt-0">{file ? formatFileSize(file.size) : "单文件上限 6MB"}</span>
            </span>
          </label>
          {fileError ? <div className="md:col-span-3"><InlineError text={fileError} /></div> : null}
          <div className="md:col-span-3">
            <button
              className={actionButtonClass("primary")}
              disabled={isSubmitting || Boolean(fileError)}
              type="submit"
            >
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {isSubmitting ? "提交中" : "提交成果"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-h-16 rounded-md border border-line bg-canvas/70 px-3 py-2">
      <div className="text-[11px] font-medium text-steel">{label}</div>
      <div className="mt-1 min-h-5 break-words text-[13px] font-semibold text-slate">{value}</div>
    </div>
  );
}

function ScoreSelect({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="block text-[12px]">
      <span className="font-medium text-slate">{label}</span>
      <select
        className={`${lexosUi.inputBare} mt-1`}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {Array.from({ length: 10 }, (_, index) => `${index + 1}`).map((score) => (
          <option key={score} value={score}>
            {score} 分
          </option>
        ))}
      </select>
    </label>
  );
}

function formatOptionalScore(score?: number): string {
  return Number.isFinite(score) ? `${score}/10` : "-";
}

function formatTaskReviewStatus(task: Task): string {
  if (!task.reviewRequired) {
    return taskReviewStatusLabels.not_required;
  }

  return taskReviewStatusLabels[task.reviewStatus ?? "pending"];
}

function TaskTimeline({ milestones }: { milestones: TaskMilestone[] }) {
  return (
    <div className="rounded-md border border-line bg-canvas/50 p-3">
      <div className="mb-3 text-[13px] font-semibold text-ink">任务时间线 / 里程碑</div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {milestones.map((milestone) => (
          <div className="min-h-24 rounded-md border border-line bg-white px-3 py-2" key={milestone.key}>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${milestoneDotClass(milestone.state)}`} />
              <span className="text-[12px] font-semibold text-slate">{milestone.label}</span>
            </div>
            <div className="mt-1 text-[13px] font-semibold text-ink">{milestone.value}</div>
            <div className="mt-0.5 min-h-4 text-[11px] leading-4 text-steel">{milestone.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskSettlementCard({ settlement, task }: { settlement?: Settlement; task: Task }) {
  return (
    <div className="rounded-md border border-line bg-white p-3">
      <div className="text-[13px] font-semibold text-ink">结算关联</div>
      <div className="mt-3 space-y-2">
        <Signal label="任务金额" value={formatMoney(task.amountCents)} />
        <Signal label="结算状态" value={settlement ? (settlement.status === "confirmed" ? "已确认" : "待确认") : "待生成"} />
        <Signal label="结算比例" value={settlement ? formatBasisPoints(settlement.settlementBasisPoints) : "-"} />
        <Signal label="律师待结算" value={settlement ? formatMoney(settlement.settlementAmountCents) : "-"} />
      </div>
    </div>
  );
}

function TaskProgress({ milestones }: { milestones: TaskMilestone[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-6">
      {milestones.map((milestone) => (
        <div
          className={`flex min-h-11 items-center gap-2 rounded-md border px-2.5 py-2 text-[12px] font-semibold ${
            milestone.state === "done"
              ? "border-teal/20 bg-teal/10 text-teal"
              : milestone.state === "current"
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : milestone.state === "cancelled"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-line bg-white text-steel"
          }`}
          key={milestone.key}
        >
          <span className={`h-2 w-2 rounded-full ${milestoneDotClass(milestone.state)}`} />
          {milestone.label}
        </div>
      ))}
    </div>
  );
}

function TaskDeliveryRecordsCard({ records }: { records: ReturnType<typeof buildTaskDeliveryRecords> }) {
  return (
    <div className="mt-3 rounded-md border border-line bg-white p-3 text-[13px]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="font-semibold text-ink">交付记录</div>
        <span className="text-[11px] text-steel">{records.length ? `${records.length} 条` : "待提交"}</span>
      </div>
      {records.length ? (
        <div className="space-y-2">
          {records.map((record) => (
            <div className="rounded-md border border-line bg-canvas/50 px-3 py-2" key={record.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold text-ink">{record.title}</div>
                {record.externalUrl ? (
                  <a className={actionButtonClass("tealSoft", "sm")} href={record.externalUrl} rel="noreferrer" target="_blank">
                    打开链接
                  </a>
                ) : null}
              </div>
              <div className="mt-1 leading-5 text-steel">{record.content}</div>
              {record.fileName ? (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-white px-2.5 py-2">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2 text-[12px] font-semibold text-slate">
                      <Paperclip className="h-3.5 w-3.5 shrink-0 text-teal" />
                      <span className="truncate">{record.fileName}</span>
                    </div>
                    {record.fileSizeBytes ? (
                      <div className="mt-0.5 text-[11px] text-steel">{formatFileSize(record.fileSizeBytes)}</div>
                    ) : null}
                  </div>
                  {record.downloadUrl ? (
                    <a
                      className={actionButtonClass("tealSoft", "sm")}
                      href={record.downloadUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <Download className="h-3.5 w-3.5" />
                      下载
                    </a>
                  ) : (
                    <span className="rounded-md bg-canvas px-2 py-1 text-[11px] font-medium text-steel">模拟附件</span>
                  )}
                </div>
              ) : null}
              {record.submittedAt ? <div className="mt-1 text-[11px] text-steel">提交时间：{record.submittedAt}</div> : null}
              {record.externalUrl ? <div className="mt-1 break-all text-teal">{record.externalUrl}</div> : null}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState text="承办律师提交成果后，这里会形成交付记录。" />
      )}
    </div>
  );
}

function milestoneDotClass(state: TaskMilestone["state"]): string {
  if (state === "done") {
    return "bg-teal";
  }

  if (state === "current") {
    return "bg-amber-500";
  }

  if (state === "cancelled") {
    return "bg-red-500";
  }

  return "bg-slate/30";
}

function PortalPage({
  customersById,
  feedback,
  onConfirmDelivery,
  tasks,
}: {
  customersById: Map<string, Customer>;
  feedback: CustomerFeedback[];
  onConfirmDelivery: (taskId: string, score: number, comment: string) => MaybePromise<void>;
  tasks: Task[];
}) {
  const approvedTasks = tasks.filter((task) => task.status === "approved" || task.status === "settlement_pending" || task.status === "settled");
  const [token, setToken] = useState(approvedTasks[0]?.portalToken ?? "LEXOS-DEMO-001");
  const [phone, setPhone] = useState("13800000000");
  const [code, setCode] = useState(DEFAULT_INITIAL_PASSWORD);
  const [verifiedTaskId, setVerifiedTaskId] = useState<string | null>(null);
  const [score, setScore] = useState("9");
  const [comment, setComment] = useState("交付清晰，响应及时。");
  const task = tasks.find((item) => item.portalToken === token);
  const customer = task ? customersById.get(task.customerId) : undefined;
  const currentFeedback = task ? feedback.find((item) => item.taskId === task.id) : undefined;
  const verified = !!task && verifiedTaskId === task.id;
  const deliveryRecords = task ? buildTaskDeliveryRecords(task).filter((item) => item.fileName) : [];

  function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!task || !customer) {
      return;
    }
    const result = verifyDemoPortalCode({
      expectedPhone: customer.phone,
      submittedPhone: phone,
      submittedCode: code,
      linkStatus: "active",
    });
    setVerifiedTaskId(result.verified ? task.id : null);
  }

  return (
    <section className="mt-8 rounded-md border border-line bg-paper p-5 shadow-soft">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <div className="text-sm font-semibold text-teal">客户确认页</div>
          <h2 className="mt-1 text-xl font-semibold">带验证码的安全访问链接</h2>
          <p className="mt-1 text-sm text-slate">客户不创建完整账号，使用任务 token + 手机验证码访问交付页面。</p>
        </div>
        <div className="flex min-h-10 items-center rounded-md border border-line bg-white px-3 text-xs font-medium text-slate">
          验证码固定为 111111
        </div>
      </div>
      <form className="mt-5 grid gap-3 md:grid-cols-4" onSubmit={verify}>
        <TextInput label="访问 token" onChange={setToken} value={token} />
        <TextInput label="客户手机号" onChange={setPhone} value={phone} />
        <TextInput label="验证码" onChange={setCode} value={code} />
        <div className="flex items-end">
          <button className={actionButtonClass("primary", "md", "w-full")} type="submit">
            校验访问
          </button>
        </div>
      </form>
      {task && verified ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-md border border-line bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <div className="text-xs text-slate">客户项目</div>
            <div className="mt-1 text-lg font-semibold">{task.title}</div>
            <p className="mt-2 text-sm leading-6 text-slate">{task.submittedContent ?? task.description}</p>
            {deliveryRecords.length ? (
              <div className="mt-4 rounded-md border border-line bg-canvas/60 p-3">
                <div className="text-[13px] font-semibold text-ink">交付附件</div>
                <div className="mt-2 space-y-2">
                  {deliveryRecords.map((item) => (
                    <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-white px-3 py-2" key={item.id}>
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2 text-[12px] font-semibold text-slate">
                          <Paperclip className="h-3.5 w-3.5 shrink-0 text-teal" />
                          <span className="truncate">{item.fileName}</span>
                        </div>
                        {item.fileSizeBytes ? <div className="mt-0.5 text-[11px] text-steel">{formatFileSize(item.fileSizeBytes)}</div> : null}
                      </div>
                      <span className="inline-flex min-h-8 items-center rounded-md border border-line bg-canvas px-2 text-[11px] font-medium text-steel">
                        交付附件
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="mt-4 space-y-3">
              {["任务已发布", "律师已承接", "成果已提交", "发起人已验收"].map((item) => (
                <div className="flex items-center gap-3 text-sm" key={item}>
                  <CheckCircle2 className="h-4 w-4 text-teal" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-md border border-line bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            {currentFeedback ? (
              <div>
                <div className="text-sm font-semibold">客户已确认</div>
                <div className="mt-2 text-3xl font-semibold text-teal">{currentFeedback.score}/10</div>
                <p className="mt-2 text-sm text-slate">{currentFeedback.comment}</p>
              </div>
            ) : task.status === "approved" ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  onConfirmDelivery(task.id, Number(score), comment);
                }}
              >
                <TextInput label="评分（0-10）" onChange={setScore} value={score} />
                <div className="mt-3">
                  <TextInput label="评价" onChange={setComment} value={comment} />
                </div>
                <button className={actionButtonClass("teal", "md", "mt-4 w-full")} type="submit">
                  确认接收并评分
                </button>
              </form>
            ) : (
              <EmptyState text="任务需要先由发起人验收，客户才能确认接收。" />
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ApiPortalPage({ onAfterFeedback }: { onAfterFeedback: () => MaybePromise<void> }) {
  const [token, setToken] = useState("");
  const [phone, setPhone] = useState("13800000000");
  const [code, setCode] = useState(DEFAULT_INITIAL_PASSWORD);
  const [portal, setPortal] = useState<ApiPortalSnapshot | null>(null);
  const [score, setScore] = useState("9");
  const [comment, setComment] = useState("交付清晰，响应及时。");
  const [confirmedFeedback, setConfirmedFeedback] = useState<CustomerFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const snapshot = await apiVerifyPortalCode(token, phone, code);
      setPortal(snapshot);
      setConfirmedFeedback(null);
    } catch (apiError) {
      setPortal(null);
      setError(apiError instanceof Error ? apiError.message : "客户链接校验失败");
    } finally {
      setLoading(false);
    }
  }

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!portal) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiSubmitPortalFeedback(token, Number(score), comment);
      setConfirmedFeedback({
        taskId: portal.taskId,
        score: Number(score),
        comment,
        confirmedAt: nowText(),
      });
      await onAfterFeedback();
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "客户确认失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 rounded-md border border-line bg-paper p-5 shadow-soft">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <div className="text-sm font-semibold text-teal">客户确认页 API</div>
          <h2 className="mt-1 text-xl font-semibold">带验证码的安全访问链接</h2>
          <p className="mt-1 text-sm text-slate">
            真实模式下，访问 token 只在创建任务时显示一次；数据库仅保存 token hash。
          </p>
        </div>
        <div className="flex min-h-10 items-center rounded-md border border-line bg-white px-3 text-xs font-medium text-slate">
          本地验证码固定为 111111
        </div>
      </div>
      <form className="mt-5 grid gap-3 md:grid-cols-4" onSubmit={verify}>
        <TextInput label="访问 token" onChange={setToken} value={token} />
        <TextInput label="客户手机号" onChange={setPhone} value={phone} />
        <TextInput label="验证码" onChange={setCode} value={code} />
        <div className="flex items-end">
          <button
            className={actionButtonClass("primary", "md", "w-full")}
            disabled={loading || !token.trim()}
            type="submit"
          >
            {loading ? "校验中" : "校验访问"}
          </button>
        </div>
      </form>
      {error ? <div className="mt-4"><InlineError text={error} /></div> : null}
      {portal ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-md border border-line bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <div className="text-xs text-slate">{portal.customerName}</div>
            <div className="mt-1 text-lg font-semibold">{portal.title}</div>
            <p className="mt-2 text-sm leading-6 text-slate">
              {portal.submittedContent ?? portal.description}
            </p>
            {portal.externalUrl ? <div className="mt-2 text-sm text-teal">{portal.externalUrl}</div> : null}
            {portal.deliverables.some((item) => item.fileName) ? (
              <div className="mt-4 rounded-md border border-line bg-canvas/60 p-3">
                <div className="text-[13px] font-semibold text-ink">交付附件</div>
                <div className="mt-2 space-y-2">
                  {portal.deliverables
                    .filter((item) => item.fileName)
                    .map((item) => (
                      <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-white px-3 py-2" key={item.id}>
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2 text-[12px] font-semibold text-slate">
                            <Paperclip className="h-3.5 w-3.5 shrink-0 text-teal" />
                            <span className="truncate">{item.fileName}</span>
                          </div>
                          {item.fileSizeBytes ? (
                            <div className="mt-0.5 text-[11px] text-steel">{formatFileSize(item.fileSizeBytes)}</div>
                          ) : null}
                        </div>
                        {item.downloadUrl ? (
                          <a
                            className={actionButtonClass("tealSoft", "sm")}
                            href={item.downloadUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <Download className="h-3.5 w-3.5" />
                            下载
                          </a>
                        ) : (
                          <span className="inline-flex min-h-8 items-center rounded-md border border-line bg-canvas px-2 text-[11px] font-medium text-steel">发起人验收后开放</span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ) : null}
            <div className="mt-4 space-y-3">
              {["任务已发布", "律师已承接", "成果已提交", "发起人已验收"].map((item) => (
                <div className="flex items-center gap-3 text-sm" key={item}>
                  <CheckCircle2 className="h-4 w-4 text-teal" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-md border border-line bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            {confirmedFeedback ? (
              <div>
                <div className="text-sm font-semibold">客户已确认</div>
                <div className="mt-2 text-3xl font-semibold text-teal">{confirmedFeedback.score}/10</div>
                <p className="mt-2 text-sm text-slate">{confirmedFeedback.comment}</p>
              </div>
            ) : portal.status === "approved" ? (
              <form onSubmit={submitFeedback}>
                <TextInput label="评分（0-10）" onChange={setScore} value={score} />
                <div className="mt-3">
                  <TextInput label="评价" onChange={setComment} value={comment} />
                </div>
                <button
                  className={actionButtonClass("teal", "md", "mt-4 w-full")}
                  disabled={loading}
                  type="submit"
                >
                  {loading ? "提交中" : "确认接收并评分"}
                </button>
              </form>
            ) : (
              <EmptyState text="任务需要先由发起人验收，客户才能确认接收。" />
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SettlementsPage({
  apiMode,
  currentUser,
  onConfirmSettlements,
  onConfirmSettlement,
  onLockSettlementRiskDeduction,
  ranks,
  refreshKey,
  riskCases,
  riskDeductionRates,
  settlements,
  settlementLockDays,
  tasks,
  usersById,
}: {
  apiMode: boolean;
  currentUser: DemoUser;
  onConfirmSettlements: (settlementIds: string[]) => MaybePromise<void>;
  onConfirmSettlement: (settlementId: string) => MaybePromise<void>;
  onLockSettlementRiskDeduction: (settlementId: string, input: LockSettlementRiskDeductionInput) => MaybePromise<void>;
  ranks: Rank[];
  refreshKey: number;
  riskCases: RiskCase[];
  riskDeductionRates: RiskDeductionRates;
  settlements: Settlement[];
  settlementLockDays: number;
  tasks: Task[];
  usersById: Map<string, DemoUser>;
}) {
  const visibleSettlements =
    isLawyerRole(currentUser.role)
      ? settlements.filter((item) => item.lawyerId === currentUser.id)
      : settlements;
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Settlement["status"] | "all">("all");
  const [sort, setSort] = useState("generatedAtDesc");
  const [page, setPage] = useState(1);
  const [selectedSettlementIds, setSelectedSettlementIds] = useState<string[]>([]);
  const [confirmingBulk, setConfirmingBulk] = useState(false);
  const [bulkConfirming, setBulkConfirming] = useState(false);
  const [confirmingSettlementId, setConfirmingSettlementId] = useState<string | null>(null);
  const [confirmingBusyId, setConfirmingBusyId] = useState<string | null>(null);
  const [deductionLockDrafts, setDeductionLockDrafts] = useState<
    Record<string, { destination: SettlementRiskPenaltyDestination; note: string }>
  >({});
  const [lockingDeductionId, setLockingDeductionId] = useState<string | null>(null);
  const [serverSettlements, setServerSettlements] = useState<Settlement[]>(visibleSettlements);
  const [serverPagination, setServerPagination] = useState<ApiPagination>(() =>
    fallbackPagination(1, TABLE_PAGE_SIZE, visibleSettlements.length),
  );
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const filteredSettlements = visibleSettlements.filter((settlement) => {
    const task = taskById.get(settlement.taskId);
    const lawyer = usersById.get(settlement.lawyerId);
    const statusText = settlement.status === "pending" ? "待确认" : "已确认";

    return (
      (statusFilter === "all" || settlement.status === statusFilter) &&
      matchesSearch(
        query,
        task?.title,
        settlement.taskTitle,
        lawyer?.displayName,
        settlement.lawyerName,
        statusText,
        formatBasisPoints(settlement.settlementBasisPoints),
        formatMoney(settlement.settlementAmountCents),
        formatMoney(effectiveSettlementAmountCents(settlement)),
      )
    );
  });
  const sortedSettlements = sortDemoItems(filteredSettlements, sort, {
    amountDesc: { direction: "desc", select: (settlement) => effectiveSettlementAmountCents(settlement) },
    generatedAtAsc: { direction: "asc", select: (settlement) => settlement.generatedAt ?? settlement.id },
    generatedAtDesc: { direction: "desc", select: (settlement) => settlement.generatedAt ?? settlement.id },
    statusAsc: { direction: "asc", select: (settlement) => settlement.status },
  });
  const settlementPage = paginateItems(sortedSettlements, page);
  const visibleRows = apiMode ? serverSettlements : settlementPage.items;
  const visibleCurrentPage = apiMode ? serverPagination.page : settlementPage.currentPage;
  const visiblePageSize = apiMode ? serverPagination.pageSize : settlementPage.pageSize;
  const visibleTotal = apiMode ? serverPagination.total : settlementPage.total;
  const visibleTotalPages = apiMode ? serverPagination.totalPages : settlementPage.totalPages;
  const canConfirmSettlements = currentUser.role === "finance";
  const canBypassSettlementRiskLock = false;
  const pendingSettlementRows = visibleSettlements.filter((settlement) => settlement.status === "pending");
  const confirmedSettlementRows = visibleSettlements.filter((settlement) => settlement.status === "confirmed");
  const pendingPayableCents = pendingSettlementRows.reduce(
    (sum, settlement) => sum + effectiveSettlementAmountCents(settlement),
    0,
  );
  const confirmedPayableCents = confirmedSettlementRows.reduce(
    (sum, settlement) => sum + effectiveSettlementAmountCents(settlement),
    0,
  );
  const lockedOrFrozenCount = pendingSettlementRows.filter(
    (settlement) =>
      settlementTaskRiskFreezeStatus(settlement, riskCases).frozen ||
      buildSettlementRiskLockStatus(settlement.generatedAt, settlementLockDays).locked,
  ).length;
  const selectedSettlementIdSet = new Set(selectedSettlementIds);
  const pendingVisibleRows = visibleRows.filter((settlement) => {
    if (settlement.status !== "pending" || !canConfirmSettlements) {
      return false;
    }

    if (settlementTaskRiskFreezeStatus(settlement, riskCases).frozen) {
      return false;
    }

    return canBypassSettlementRiskLock || !buildSettlementRiskLockStatus(settlement.generatedAt, settlementLockDays).locked;
  });
  const selectedPendingRows = pendingVisibleRows.filter((settlement) => selectedSettlementIdSet.has(settlement.id));
  const selectedPendingIds = selectedPendingRows.map((settlement) => settlement.id);
  const allVisiblePendingSelected =
    pendingVisibleRows.length > 0 && pendingVisibleRows.every((settlement) => selectedSettlementIdSet.has(settlement.id));
  const settlementListParams: ApiListParams = {
    page,
    pageSize: TABLE_PAGE_SIZE,
    search: query,
    sort,
    status: statusFilter,
  };
  const settlementExportParams: ApiListParams = {
    search: query,
    sort,
    status: statusFilter,
  };
  const exportPath = apiBuildSettlementsExportPath(settlementExportParams);
  const demoExportCsv = settlementsToCsv(
    sortedSettlements.map((settlement) => {
      const task = taskById.get(settlement.taskId);
      const lawyer = usersById.get(settlement.lawyerId);

      return {
        id: settlement.id,
        confirmedAt: settlement.confirmedAt,
        generatedAt: settlement.generatedAt,
        lawyerName: lawyer?.displayName ?? settlement.lawyerName,
        lawyerUsername: lawyer?.username,
        payableAmountCents: effectiveSettlementAmountCents(settlement),
        rankCode: settlement.rankCode,
        riskDeductionAmountCents: settlement.riskDeductionAmountCents,
        riskDeductionLockedAt: settlement.riskDeductionLockedAt,
        riskPenaltyDestination: settlement.riskPenaltyDestination,
        settlementAmountCents: settlement.settlementAmountCents,
        settlementBasisPoints: settlement.settlementBasisPoints,
        status: settlement.status,
        taskAmountCents: settlement.taskAmountCents,
        taskTitle: task?.title ?? settlement.taskTitle,
      };
    }),
  );
  const demoExportHref = `data:text/csv;charset=utf-8,${encodeURIComponent(demoExportCsv)}`;

  useEffect(() => {
    setPage(1);
    setSelectedSettlementIds([]);
    setConfirmingBulk(false);
  }, [query, sort, statusFilter]);

  useEffect(() => {
    if (!apiMode) {
      return;
    }

    let active = true;

    async function loadSettlementsPage() {
      setIsLoadingList(true);
      setListError(null);

      try {
        const result = await apiFetchSettlementsPage(ranks, settlementListParams);

        if (!active) {
          return;
        }

        setServerSettlements(result.items);
        setServerPagination(result.pagination);
      } catch (error) {
        if (active) {
          setListError(error instanceof Error ? error.message : "结算列表加载失败");
        }
      } finally {
        if (active) {
          setIsLoadingList(false);
        }
      }
    }

    void loadSettlementsPage();

    return () => {
      active = false;
    };
    // settlementListParams is rebuilt each render; explicit primitive deps keep the fetch stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiMode, page, query, ranks, refreshKey, sort, statusFilter]);

  async function confirm(settlementId: string) {
    setConfirmingBusyId(settlementId);

    try {
      await onConfirmSettlement(settlementId);
      setConfirmingSettlementId(null);
      setSelectedSettlementIds((ids) => ids.filter((id) => id !== settlementId));
    } finally {
      setConfirmingBusyId(null);
    }
  }

  function toggleSettlement(settlementId: string) {
    setConfirmingBulk(false);
    setSelectedSettlementIds((ids) =>
      ids.includes(settlementId) ? ids.filter((id) => id !== settlementId) : [...ids, settlementId],
    );
  }

  function toggleVisiblePendingSettlements() {
    setConfirmingBulk(false);

    if (allVisiblePendingSelected) {
      const visibleIds = new Set(pendingVisibleRows.map((settlement) => settlement.id));
      setSelectedSettlementIds((ids) => ids.filter((id) => !visibleIds.has(id)));
      return;
    }

    setSelectedSettlementIds((ids) =>
      Array.from(new Set([...ids, ...pendingVisibleRows.map((settlement) => settlement.id)])),
    );
  }

  async function confirmSelectedSettlements() {
    if (!selectedPendingIds.length) {
      return;
    }

    setBulkConfirming(true);

    try {
      await onConfirmSettlements(selectedPendingIds);
      setSelectedSettlementIds((ids) => ids.filter((id) => !selectedPendingIds.includes(id)));
      setConfirmingBulk(false);
    } finally {
      setBulkConfirming(false);
    }
  }

  function getDeductionLockDraft(settlementId: string) {
    return deductionLockDrafts[settlementId] ?? { destination: "risk_reserve" as const, note: "" };
  }

  function updateDeductionLockDraft(
    settlementId: string,
    patch: Partial<{ destination: SettlementRiskPenaltyDestination; note: string }>,
  ) {
    setDeductionLockDrafts((drafts) => ({
      ...drafts,
      [settlementId]: {
        ...(drafts[settlementId] ?? { destination: "risk_reserve" as const, note: "" }),
        ...patch,
      },
    }));
  }

  async function lockDeductionForSettlement(settlementId: string, riskCaseId: string) {
    const draft = getDeductionLockDraft(settlementId);

    setLockingDeductionId(settlementId);

    try {
      await onLockSettlementRiskDeduction(settlementId, {
        destination: draft.destination,
        note: draft.note,
        riskCaseId,
      });
      setSelectedSettlementIds((ids) => ids.filter((id) => id !== settlementId));
      setDeductionLockDrafts((drafts) => {
        const nextDrafts = { ...drafts };

        delete nextDrafts[settlementId];

        return nextDrafts;
      });
    } finally {
      setLockingDeductionId(null);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader description="第一版按任务金额和职级比例生成待结算记录。" title="结算管理" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <OperationsCue
          detail={`预计实付 ${formatMoney(pendingPayableCents)}`}
          label="待确认结算"
          tone={pendingSettlementRows.length ? "gold" : "teal"}
          value={`${pendingSettlementRows.length}`}
        />
        <OperationsCue
          detail={`已确认实付 ${formatMoney(confirmedPayableCents)}`}
          label="已确认结算"
          tone="teal"
          value={`${confirmedSettlementRows.length}`}
        />
        <OperationsCue
          detail={`锁定期 ${settlementLockDays} 天；含风控冻结`}
          label="锁定 / 冻结"
          tone={lockedOrFrozenCount ? "rose" : "ink"}
          value={`${lockedOrFrozenCount}`}
        />
        <OperationsCue
          detail={canConfirmSettlements ? "勾选待确认记录后可批量处理" : "律师仅查看个人结算"}
          label="本页可批量确认"
          tone={selectedPendingIds.length ? "teal" : "ink"}
          value={`${selectedPendingIds.length}`}
        />
      </div>
      <Panel title="结算记录">
        <ListToolbar
          onSearchChange={setQuery}
          resultText={isLoadingList ? "加载结算中..." : resultCountText(visibleTotal, "条结算", apiMode)}
          searchPlaceholder="搜索任务、律师、金额或比例"
          searchValue={query}
        >
          <ToolbarSelect
            ariaLabel="按结算状态筛选"
            onChange={(value) => setStatusFilter(value as Settlement["status"] | "all")}
            options={[
              ["all", "全部状态"],
              ["pending", "待确认"],
              ["confirmed", "已确认"],
            ]}
            value={statusFilter}
          />
          <ToolbarSelect ariaLabel="结算排序" onChange={setSort} options={settlementSortOptions} value={sort} />
          <a
            className={actionButtonClass("primary", "sm")}
            download={apiMode ? undefined : "lexos-settlements-local.csv"}
            href={apiMode ? exportPath : demoExportHref}
          >
            <Download className="h-3.5 w-3.5" />
            导出 CSV
          </a>
          {canConfirmSettlements ? (
            confirmingBulk ? (
              <div className="inline-flex min-h-10 flex-wrap items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2 text-[12px] text-amber-900">
                <span className="font-semibold">确认 {selectedPendingIds.length} 条？</span>
                <button
                  className={actionButtonClass("ghost", "sm")}
                  disabled={bulkConfirming}
                  onClick={() => setConfirmingBulk(false)}
                  type="button"
                >
                  取消
                </button>
                <button
                  className={actionButtonClass("primary", "sm")}
                  disabled={bulkConfirming}
                  onClick={confirmSelectedSettlements}
                  type="button"
                >
                  {bulkConfirming ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  确认
                </button>
              </div>
            ) : (
              <button
                aria-label="批量确认结算"
                className={actionButtonClass("teal", "sm", "disabled:border-line disabled:bg-canvas disabled:text-steel")}
                disabled={!selectedPendingIds.length}
                onClick={() => setConfirmingBulk(true)}
                type="button"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                批量确认{selectedPendingIds.length ? ` ${selectedPendingIds.length}` : ""}
              </button>
            )
          ) : null}
        </ListToolbar>
        {listError ? <InlineError text={listError} /> : null}
        {visibleRows.length ? (
          <div className={lexosUi.tableWrap}>
            <table className={`${lexosUi.table} min-w-[1320px]`}>
              <thead className={lexosUi.tableHead}>
                <tr>
                  {canConfirmSettlements ? (
                    <th className="w-11 px-3 py-2.5">
                      <input
                        aria-label="选择本页待确认结算"
                        checked={allVisiblePendingSelected}
                        className="h-4 w-4 accent-teal"
                        disabled={!pendingVisibleRows.length}
                        onChange={toggleVisiblePendingSettlements}
                        type="checkbox"
                      />
                    </th>
                  ) : null}
                  <th className="px-3 py-2.5 font-semibold">任务</th>
                  <th className="px-3 py-2.5 font-semibold">律师</th>
                  <th className="px-3 py-2.5 font-semibold">职级比例</th>
                  <th className="px-3 py-2.5 font-semibold">结算金额</th>
                  <th className="px-3 py-2.5 font-semibold">状态</th>
                  <th className="px-3 py-2.5 font-semibold">冻结状态</th>
                  <th className="px-3 py-2.5 font-semibold">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibleRows.map((settlement) => {
                  const task = taskById.get(settlement.taskId);
                  const lawyer = usersById.get(settlement.lawyerId);
                  const settlementLabel = task?.title ?? settlement.taskTitle ?? settlement.id;
                  const lockStatus = buildSettlementRiskLockStatus(settlement.generatedAt, settlementLockDays);
                  const taskFreezeStatus = settlementTaskRiskFreezeStatus(settlement, riskCases);
                  const deductionLockCandidate = taskFreezeStatus.deductionLockCandidate;
                  const deductionLockDraft = getDeductionLockDraft(settlement.id);
                  const deductionCandidateCalculation = deductionLockCandidate
                    ? calculateSettlementRiskDeduction(settlement.settlementAmountCents, deductionLockCandidate.basisPoints)
                    : null;
                  const deductionRiskCase = deductionLockCandidate
                    ? riskCases.find((item) => item.id === deductionLockCandidate.riskCaseId)
                    : undefined;
                  const deductionLockPermission = canLockSettlementRiskDeduction({
                    deductionBasisPoints: deductionLockCandidate?.basisPoints,
                    existingLockedAt: settlement.riskDeductionLockedAt,
                    riskCaseDecision: deductionRiskCase?.committeeDecision ?? (deductionLockCandidate ? "deduction" : undefined),
                    riskCaseStatus: deductionRiskCase?.status ?? (deductionLockCandidate ? "in_review" : undefined),
                    settlementStatus: settlement.status,
                  });
                  const deductionPreview = settlementRiskDeductionPreview(settlement, taskFreezeStatus, riskDeductionRates);
                  const effectiveAmountCents = effectiveSettlementAmountCents(settlement);
                  const hasLockedDeduction = Boolean(settlement.riskDeductionLockedAt);
                  const canLockDeductionRow =
                    canConfirmSettlements && Boolean(deductionLockCandidate) && deductionLockPermission.allowed;
                  const isSettlementRiskLocked =
                    settlement.status === "pending" && lockStatus.locked && !canBypassSettlementRiskLock;
                  const isRiskLocked = settlement.status === "pending" && (taskFreezeStatus.frozen || isSettlementRiskLocked);
                  const canConfirmRow =
                    settlement.status === "pending" &&
                    canConfirmSettlements &&
                    !taskFreezeStatus.frozen &&
                    (canBypassSettlementRiskLock || !lockStatus.locked);

                  return (
                    <tr className="hover:bg-canvas/70" key={settlement.id}>
                      {canConfirmSettlements ? (
                        <td className="px-3 py-2.5">
                          {settlement.status === "pending" ? (
                            <input
                              aria-label={`选择结算 ${settlementLabel}`}
                              checked={selectedSettlementIdSet.has(settlement.id)}
                              className="h-4 w-4 accent-teal"
                              disabled={isRiskLocked}
                              onChange={() => toggleSettlement(settlement.id)}
                              type="checkbox"
                            />
                          ) : (
                            <span className="text-steel">-</span>
                          )}
                        </td>
                      ) : null}
                      <td className="whitespace-nowrap px-3 py-2.5 font-medium">{task?.title ?? settlement.taskTitle ?? "-"}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate">{lawyer?.displayName ?? settlement.lawyerName ?? "-"}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate">{formatBasisPoints(settlement.settlementBasisPoints)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <div className="font-semibold">{formatMoney(effectiveAmountCents)}</div>
                        {hasLockedDeduction ? (
                          <div className="mt-0.5 text-[11px] leading-4 text-steel">
                            原 {formatMoney(settlement.settlementAmountCents)} · 扣减{" "}
                            {formatMoney(settlement.riskDeductionAmountCents ?? 0)}
                          </div>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate">{settlement.status === "pending" ? "待确认" : "已确认"}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate">
                        {settlement.status === "confirmed" ? (
                          <span>已确认 {formatDateTimeText(settlement.confirmedAt)}</span>
                        ) : hasLockedDeduction ? (
                          <span className="font-medium text-teal">
                            扣罚已锁定
                            <span className="block max-w-72 whitespace-normal text-[11px] font-normal leading-5 text-steel">
                              {riskPenaltyDestinationLabel(settlement.riskPenaltyDestination)} · 实付 {formatMoney(effectiveAmountCents)}
                            </span>
                          </span>
                        ) : taskFreezeStatus.frozen ? (
                          <span className="font-medium text-rose-700">
                            {deductionLockCandidate ? "待锁定扣罚" : "风控冻结"}
                            <span className="block max-w-60 truncate text-[11px] font-normal text-steel">
                              {taskRiskFreezeStatusText(taskFreezeStatus)}
                            </span>
                            {deductionLockCandidate && deductionCandidateCalculation ? (
                              <span className="block max-w-72 whitespace-normal text-[11px] font-normal leading-5 text-rose-700">
                                裁决扣减 {formatBasisPoints(deductionLockCandidate.basisPoints)} ·{" "}
                                {formatMoney(deductionCandidateCalculation.deductionAmountCents)}，锁定后实付{" "}
                                {formatMoney(deductionCandidateCalculation.payableAmountCents)}
                              </span>
                            ) : null}
                            {deductionPreview ? (
                              <span className="block max-w-72 whitespace-normal text-[11px] font-normal leading-5 text-rose-700">
                                {riskDeductionPreviewText(deductionPreview)}
                              </span>
                            ) : null}
                          </span>
                        ) : settlementLockDays <= 0 ? (
                          <span>未启用</span>
                        ) : lockStatus.locked ? (
                          <span>
                            锁定中 {lockStatus.daysRemaining} 天
                            <span className="block text-[11px] text-steel">
                              {`预计 ${formatDateTimeText(lockStatus.lockedUntil)}`}
                            </span>
                          </span>
                        ) : (
                          <span>可确认</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {canLockDeductionRow && deductionLockCandidate ? (
                          <div className="flex w-[280px] flex-col gap-2">
                            <div className="text-[11px] font-medium leading-4 text-rose-700">
                              扣减裁决待锁定
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                aria-label={`${settlementLabel} 扣罚去向`}
                                className="focus-ring h-10 min-w-0 flex-1 rounded-md border border-line bg-white px-2 text-[12px] text-slate"
                                onChange={(event) =>
                                  updateDeductionLockDraft(settlement.id, {
                                    destination: event.target.value as SettlementRiskPenaltyDestination,
                                  })
                                }
                                value={deductionLockDraft.destination}
                              >
                                {settlementRiskPenaltyDestinations.map((destination) => (
                                  <option key={destination} value={destination}>
                                    {settlementRiskPenaltyDestinationLabels[destination]}
                                  </option>
                                ))}
                              </select>
                              <button
                                className={actionButtonClass("danger", "sm", "shrink-0")}
                                disabled={lockingDeductionId === settlement.id}
                                onClick={() => lockDeductionForSettlement(settlement.id, deductionLockCandidate.riskCaseId)}
                                type="button"
                              >
                                {lockingDeductionId === settlement.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                锁定扣罚
                              </button>
                            </div>
                            <input
                              aria-label={`${settlementLabel} 扣罚说明`}
                              className="focus-ring h-10 rounded-md border border-line bg-white px-2 text-[12px] text-slate placeholder:text-steel"
                              onChange={(event) => updateDeductionLockDraft(settlement.id, { note: event.target.value })}
                              placeholder="说明，可选"
                              value={deductionLockDraft.note}
                            />
                          </div>
                        ) : canConfirmRow ? (
                          confirmingSettlementId === settlement.id ? (
                            <div className="inline-flex flex-wrap items-center gap-2 rounded-md border border-navy/15 bg-canvas px-2 py-1">
                              <span className="text-[12px] font-medium text-slate">确认结算？</span>
                              <button
                                className={actionButtonClass("ghost", "sm")}
                                disabled={confirmingBusyId === settlement.id}
                                onClick={() => setConfirmingSettlementId(null)}
                                type="button"
                              >
                                取消
                              </button>
                              <button
                                className={actionButtonClass("primary", "sm")}
                                disabled={confirmingBusyId === settlement.id}
                                onClick={() => confirm(settlement.id)}
                                type="button"
                              >
                                {confirmingBusyId === settlement.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                确认
                              </button>
                            </div>
                          ) : (
                            <button
                              className={actionButtonClass("primary", "sm")}
                              onClick={() => setConfirmingSettlementId(settlement.id)}
                              type="button"
                            >
                              财务确认
                            </button>
                          )
                        ) : settlement.status === "pending" && canConfirmSettlements ? (
                          <span className="text-[12px] text-steel">
                            {deductionLockCandidate ? "待锁定扣罚" : taskFreezeStatus.frozen ? "风控冻结" : "锁定中"}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="客户确认接收后，系统会自动生成待结算记录。" />
        )}
        <Pagination
          currentPage={visibleCurrentPage}
          onPageChange={setPage}
          pageSize={visiblePageSize}
          total={visibleTotal}
          totalPages={visibleTotalPages}
        />
      </Panel>
    </div>
  );
}

function FundsPage({
  apiMode,
  fundTransactions,
  refreshKey,
}: {
  apiMode: boolean;
  fundTransactions: FundTransaction[];
  refreshKey: number;
}) {
  const [query, setQuery] = useState("");
  const [accountFilter, setAccountFilter] = useState<SettlementRiskPenaltyDestination | "all">("all");
  const [sort, setSort] = useState("createdAtDesc");
  const [page, setPage] = useState(1);
  const [serverTransactions, setServerTransactions] = useState<FundTransaction[]>(fundTransactions);
  const [serverSummary, setServerSummary] = useState<FundSummaryItem[]>(() => buildFundSummary(fundTransactions));
  const [serverPagination, setServerPagination] = useState<ApiPagination>(() =>
    fallbackPagination(1, TABLE_PAGE_SIZE, fundTransactions.length),
  );
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const demoSummary = useMemo(() => buildFundSummary(fundTransactions), [fundTransactions]);
  const filteredTransactions = fundTransactions.filter(
    (transaction) =>
      (accountFilter === "all" || transaction.accountType === accountFilter) &&
      matchesSearch(
        query,
        fundAccountLabel(transaction.accountType),
        fundTransactionTypeLabel(transaction.transactionType),
        transaction.taskTitle,
        transaction.riskCaseTitle,
        transaction.lawyerName,
        transaction.createdByName,
        transaction.note,
        formatMoney(transaction.amountCents),
      ),
  );
  const sortedTransactions = sortDemoItems(filteredTransactions, sort, {
    accountTypeAsc: { direction: "asc", select: (transaction) => transaction.accountType },
    amountDesc: { direction: "desc", select: (transaction) => transaction.amountCents },
    createdAtAsc: { direction: "asc", select: (transaction) => transaction.createdAt },
    createdAtDesc: { direction: "desc", select: (transaction) => transaction.createdAt },
  });
  const transactionPage = paginateItems(sortedTransactions, page);
  const visibleRows = apiMode ? serverTransactions : transactionPage.items;
  const visibleSummary = apiMode ? serverSummary : demoSummary;
  const visibleCurrentPage = apiMode ? serverPagination.page : transactionPage.currentPage;
  const visiblePageSize = apiMode ? serverPagination.pageSize : transactionPage.pageSize;
  const visibleTotal = apiMode ? serverPagination.total : transactionPage.total;
  const visibleTotalPages = apiMode ? serverPagination.totalPages : transactionPage.totalPages;
  const fundListParams: ApiListParams = {
    accountType: accountFilter,
    page,
    pageSize: TABLE_PAGE_SIZE,
    search: query,
    sort,
  };

  useEffect(() => {
    setPage(1);
  }, [accountFilter, query, sort]);

  useEffect(() => {
    if (!apiMode) {
      return;
    }

    let active = true;

    async function loadFundsPage() {
      setIsLoadingList(true);
      setListError(null);

      try {
        const result = await apiFetchFundsPage(fundListParams);

        if (!active) {
          return;
        }

        setServerTransactions(result.items);
        setServerPagination(result.pagination);
        setServerSummary(result.summary);
      } catch (error) {
        if (active) {
          setListError(error instanceof Error ? error.message : "资金流水加载失败");
        }
      } finally {
        if (active) {
          setIsLoadingList(false);
        }
      }
    }

    void loadFundsPage();

    return () => {
      active = false;
    };
    // fundListParams is rebuilt each render; explicit primitive deps keep the fetch stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountFilter, apiMode, page, query, refreshKey, sort]);

  return (
    <div className="space-y-4">
      <PageHeader
        description="按扣罚去向沉淀公共风险储备金、质量督导基金、客户退费和律所留存流水。"
        title="资金台账"
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {visibleSummary.map((summary) => (
          <div className="min-h-40 rounded-md border border-line bg-paper p-4 shadow-soft transition hover:border-steel/40" key={summary.accountType}>
            <div className="flex items-center justify-between gap-3">
              <div className="text-[12px] font-medium text-steel">{summary.label}</div>
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal/10 text-teal">
                <Banknote className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2 text-[24px] font-semibold leading-8 text-ink">{formatMoney(summary.balanceCents)}</div>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-[11px] leading-5 text-steel">
              <span className="rounded-md bg-canvas px-2 py-1">入账 {formatMoney(summary.inflowCents)}</span>
              <span className="rounded-md bg-canvas px-2 py-1">支出 {formatMoney(summary.outflowCents)}</span>
              <span className="rounded-md bg-canvas px-2 py-1">{summary.postedCount} 笔</span>
              <span className="rounded-md bg-canvas px-2 py-1">
                {summary.latestTransactionAt ? formatDateTimeText(summary.latestTransactionAt) : "暂无入账"}
              </span>
            </div>
          </div>
        ))}
      </div>
      <Panel title="资金流水">
        <ListToolbar
          onSearchChange={setQuery}
          resultText={isLoadingList ? "加载流水中..." : resultCountText(visibleTotal, "条流水", apiMode)}
          searchPlaceholder="搜索账户、任务、风控、经办人或金额"
          searchValue={query}
        >
          <ToolbarSelect
            ariaLabel="按资金账户筛选"
            onChange={(value) => setAccountFilter(value as SettlementRiskPenaltyDestination | "all")}
            options={fundAccountOptions}
            value={accountFilter}
          />
          <ToolbarSelect ariaLabel="资金流水排序" onChange={setSort} options={fundSortOptions} value={sort} />
        </ListToolbar>
        {listError ? <InlineError text={listError} /> : null}
        <DataTable
          emptyText="锁定扣罚资金流向后，系统会在这里生成资金流水。"
          headers={["入账时间", "账户", "类型", "金额", "来源", "经办", "状态"]}
          rows={visibleRows.map((transaction) => [
            formatDateTimeText(transaction.createdAt),
            fundAccountLabel(transaction.accountType),
            fundTransactionTypeLabel(transaction.transactionType),
            `${transaction.direction === "outflow" ? "-" : "+"}${formatMoney(transaction.amountCents)}`,
            fundTransactionSourceText(transaction),
            transaction.createdByName ?? "系统",
            transaction.status === "posted" ? "已入账" : "已作废",
          ])}
        />
        <Pagination
          currentPage={visibleCurrentPage}
          onPageChange={setPage}
          pageSize={visiblePageSize}
          total={visibleTotal}
          totalPages={visibleTotalPages}
        />
      </Panel>
    </div>
  );
}

function fundTransactionSourceText(transaction: FundTransaction): string {
  const title = transaction.taskTitle ?? transaction.riskCaseTitle ?? transaction.settlementId ?? "-";
  const lawyer = transaction.lawyerName ? ` · ${transaction.lawyerName}` : "";

  return `${title}${lawyer}`;
}

function RiskCasesPage({
  apiMode,
  currentUser,
  customersById,
  onCreateRiskCase,
  onSubmitRiskCaseDecision,
  onSubmitRiskCaseDefense,
  onUpdateRiskCaseStatus,
  refreshKey,
  riskCases,
  riskDeductionRates,
  tasks,
  usersById,
}: {
  apiMode: boolean;
  currentUser: DemoUser;
  customersById: Map<string, Customer>;
  onCreateRiskCase: (input: CreateRiskCaseInput) => MaybePromise<void>;
  onSubmitRiskCaseDecision: (riskCaseId: string, input: SubmitRiskCaseDecisionInput) => MaybePromise<void>;
  onSubmitRiskCaseDefense: (riskCaseId: string, defenseStatement: string) => MaybePromise<void>;
  onUpdateRiskCaseStatus: (riskCaseId: string, input: UpdateRiskCaseStatusInput) => MaybePromise<void>;
  refreshKey: number;
  riskCases: RiskCase[];
  riskDeductionRates: RiskDeductionRates;
  tasks: Task[];
  usersById: Map<string, DemoUser>;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sort, setSort] = useState("createdAtDesc");
  const [page, setPage] = useState(1);
  const [serverRiskCases, setServerRiskCases] = useState<RiskCase[]>(riskCases);
  const [serverPagination, setServerPagination] = useState<ApiPagination>(() => fallbackPagination(1, TABLE_PAGE_SIZE, riskCases.length));
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [formTaskId, setFormTaskId] = useState("");
  const [formSource, setFormSource] = useState<RiskCase["source"]>("customer_complaint");
  const [formSeverity, setFormSeverity] = useState<RiskCase["severity"]>("medium");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingRiskCaseId, setPendingRiskCaseId] = useState<string | null>(null);
  const [resolutionDrafts, setResolutionDrafts] = useState<Record<string, string>>({});
  const [defenseDrafts, setDefenseDrafts] = useState<Record<string, string>>({});
  const [pendingDefenseRiskCaseId, setPendingDefenseRiskCaseId] = useState<string | null>(null);
  const [decisionDrafts, setDecisionDrafts] = useState<
    Record<string, { decision: RiskCaseCommitteeDecision; deductionBasisPoints: number; note: string }>
  >({});
  const [pendingDecisionRiskCaseId, setPendingDecisionRiskCaseId] = useState<string | null>(null);
  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const canCreateRiskCases = isDirectorRole(currentUser.role) || isLawyerRole(currentUser.role);
  const canUpdateRiskCaseStatus = canCreateRiskCases;
  const canDecideRiskCases = canSubmitRiskCaseCommitteeDecision(currentUser);
  const availableTasks = isLawyerRole(currentUser.role)
    ? tasks.filter((task) => task.sourceLawyerId === currentUser.id || task.assignedLawyerId === currentUser.id)
    : tasks;
  const scopedRiskCases = isLawyerRole(currentUser.role)
    ? riskCases.filter((item) => {
        const linkedTask = item.taskId ? taskById.get(item.taskId) : undefined;

        return item.reportedByUserId === currentUser.id || canSubmitRiskCaseDefense(currentUser, item, linkedTask);
      })
    : riskCases;
  const openRiskCases = scopedRiskCases.filter((item) => item.status !== "resolved");
  const majorRiskCases = openRiskCases.filter((item) => item.severity === "critical" || item.severity === "high");
  const lowScoreRiskCases = scopedRiskCases.filter((item) => item.source === "low_score");
  const defensePendingRiskCases = scopedRiskCases.filter((item) => !item.defendedAt && item.status !== "resolved");
  const committeePendingRiskCases = scopedRiskCases.filter((item) => !item.committeeDecision && item.status !== "resolved");
  const repeatDisciplineStats = buildRepeatDisciplineStats({
    riskCases: scopedRiskCases,
    tasks,
    users: Array.from(usersById.values()),
  });
  const visibleRepeatDisciplineStats =
    isLawyerRole(currentUser.role)
      ? repeatDisciplineStats.filter((stat) => stat.lawyerId === currentUser.id)
      : repeatDisciplineStats;
  const repeatDisciplineSummary = summarizeRepeatDisciplineStats(visibleRepeatDisciplineStats);
  const filteredRiskCases = scopedRiskCases.filter(
    (item) =>
      (statusFilter === "all" || item.status === statusFilter) &&
      (severityFilter === "all" || item.severity === severityFilter) &&
      (sourceFilter === "all" || item.source === sourceFilter) &&
      matchesSearch(
        query,
        item.title,
        item.description,
        item.taskTitle,
        item.customerName,
        item.reporterName,
        riskCaseSourceLabels[item.source],
        riskCaseSeverityLabels[item.severity],
        riskCaseStatusLabels[item.status],
      ),
  );
  const sortedRiskCases = sortDemoItems(filteredRiskCases, sort, {
    createdAtAsc: { direction: "asc", select: (item) => item.rawCreatedAt ?? item.createdAt },
    createdAtDesc: { direction: "desc", select: (item) => item.rawCreatedAt ?? item.createdAt },
    severityAsc: { direction: "asc", select: (item) => item.severity },
    statusAsc: { direction: "asc", select: (item) => item.status },
  });
  const riskCasePage = paginateItems(sortedRiskCases, page);
  const visibleRiskCases = apiMode ? serverRiskCases : riskCasePage.items;
  const visibleCurrentPage = apiMode ? serverPagination.page : riskCasePage.currentPage;
  const visiblePageSize = apiMode ? serverPagination.pageSize : riskCasePage.pageSize;
  const visibleTotal = apiMode ? serverPagination.total : riskCasePage.total;
  const visibleTotalPages = apiMode ? serverPagination.totalPages : riskCasePage.totalPages;
  const listParams: ApiListParams = {
    page,
    pageSize: TABLE_PAGE_SIZE,
    search: query,
    severity: severityFilter,
    sort,
    source: sourceFilter,
    status: statusFilter,
  };

  useEffect(() => {
    setPage(1);
  }, [query, severityFilter, sort, sourceFilter, statusFilter]);

  useEffect(() => {
    if (!apiMode) {
      return;
    }

    let active = true;

    async function loadRiskCasesPage() {
      setIsLoadingList(true);
      setListError(null);

      try {
        const result = await apiFetchRiskCasesPage(listParams);

        if (!active) {
          return;
        }

        setServerRiskCases(result.items);
        setServerPagination(result.pagination);
      } catch (error) {
        if (active) {
          setListError(error instanceof Error ? error.message : "风控工单加载失败");
        }
      } finally {
        if (active) {
          setIsLoadingList(false);
        }
      }
    }

    void loadRiskCasesPage();

    return () => {
      active = false;
    };
    // listParams is rebuilt each render; explicit primitive deps keep the fetch stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiMode, page, query, refreshKey, severityFilter, sort, sourceFilter, statusFilter]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!formTitle.trim()) {
      setFormError("请填写风控标题。");
      return;
    }

    setIsSubmitting(true);

    try {
      await onCreateRiskCase({
        description: formDescription,
        severity: formSeverity,
        source: formSource,
        taskId: formTaskId || undefined,
        title: formTitle,
      });
      setFormTitle("");
      setFormDescription("");
      setFormTaskId("");
      setFormSource("customer_complaint");
      setFormSeverity("medium");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusAction(riskCase: RiskCase, action: RiskCaseAction) {
    const resolutionNote = resolutionDrafts[riskCase.id]?.trim();

    setActionError(null);

    if (action === "resolve" && !resolutionNote) {
      setActionError("请先填写处理意见，再办结风控工单。");
      return;
    }

    setPendingRiskCaseId(riskCase.id);

    try {
      await onUpdateRiskCaseStatus(riskCase.id, {
        action,
        resolutionNote: resolutionNote || undefined,
      });

      if (action === "resolve") {
        setResolutionDrafts((items) => {
          const next = { ...items };
          delete next[riskCase.id];
          return next;
        });
      }
    } finally {
      setPendingRiskCaseId(null);
    }
  }

  async function handleDefenseSubmit(riskCase: RiskCase) {
    const draft = defenseDrafts[riskCase.id]?.trim();

    setActionError(null);

    if (!draft) {
      setActionError("请先填写答辩说明。");
      return;
    }

    setPendingDefenseRiskCaseId(riskCase.id);

    try {
      await onSubmitRiskCaseDefense(riskCase.id, draft);
      setDefenseDrafts((items) => {
        const next = { ...items };
        delete next[riskCase.id];
        return next;
      });
    } finally {
      setPendingDefenseRiskCaseId(null);
    }
  }

  async function handleCommitteeDecisionSubmit(riskCase: RiskCase) {
    const draft = decisionDrafts[riskCase.id] ?? {
      decision: "warning" as RiskCaseCommitteeDecision,
      deductionBasisPoints: riskCase.committeeDeductionBasisPoints ?? 500,
      note: "",
    };

    setActionError(null);

    if (!draft.note.trim()) {
      setActionError("请先填写委员会裁决意见。");
      return;
    }

    setPendingDecisionRiskCaseId(riskCase.id);

    try {
      await onSubmitRiskCaseDecision(riskCase.id, {
        decision: draft.decision,
        deductionBasisPoints: draft.deductionBasisPoints,
        note: draft.note,
      });
      setDecisionDrafts((items) => {
        const next = { ...items };
        delete next[riskCase.id];
        return next;
      });
    } finally {
      setPendingDecisionRiskCaseId(null);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader description="登记客户投诉、低分触发和人工风控提醒，先形成可追踪工单，再进入后续冻结、答辩和裁决。" title="投诉与风控" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Metric icon={AlertTriangle} label="待处理风控" value={`${openRiskCases.length}`} />
        <Metric icon={ShieldCheck} label="严重及以上" value={`${majorRiskCases.length}`} />
        <Metric icon={ClipboardList} label="低分触发" value={`${lowScoreRiskCases.length}`} />
        <Metric
          icon={Gavel}
          label={isLawyerRole(currentUser.role) ? "待答辩" : "待裁决"}
          value={`${isLawyerRole(currentUser.role) ? defensePendingRiskCases.length : committeePendingRiskCases.length}`}
        />
        <Metric icon={Gavel} label="累犯建议" value={`${repeatDisciplineSummary.actionableLawyerCount}`} />
      </div>
      <RepeatDisciplinePanel stats={visibleRepeatDisciplineStats} />
      {canCreateRiskCases ? (
        <Panel title="登记风控工单">
          <form className="grid gap-3 xl:grid-cols-[1fr_1fr_1fr_1.2fr_auto]" onSubmit={handleSubmit}>
            <SelectInput
              label="关联任务"
              onChange={setFormTaskId}
              options={[
                ["", "不关联任务"],
                ...availableTasks.map((task) => [
                  task.id,
                  `${task.title} · ${customersById.get(task.customerId)?.name ?? task.customerName ?? "客户"}`,
                ]),
              ]}
              value={formTaskId}
            />
            <SelectInput
              label="来源"
              onChange={(value) => setFormSource(value as RiskCase["source"])}
              options={riskCaseSourceOptions.filter(([value]) => value !== "all")}
              value={formSource}
            />
            <SelectInput
              label="级别"
              onChange={(value) => setFormSeverity(value as RiskCase["severity"])}
              options={riskCaseSeverityOptions.filter(([value]) => value !== "all")}
              value={formSeverity}
            />
            <TextInput label="标题" onChange={setFormTitle} value={formTitle} />
            <button
              className={actionButtonClass("primary", "md", "self-end")}
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              登记
            </button>
            <label className="block text-[12px] xl:col-span-5">
              <span className="font-medium text-slate">说明</span>
              <textarea
                className={`${lexosUi.input} min-h-20 resize-y py-2`}
                onChange={(event) => setFormDescription(event.target.value)}
                value={formDescription}
              />
            </label>
          </form>
          {formError ? <div className="mt-3"><InlineError text={formError} /></div> : null}
        </Panel>
      ) : null}
      <Panel title="风控工单">
        <ListToolbar
          onSearchChange={setQuery}
          resultText={isLoadingList ? "加载风控工单中..." : resultCountText(visibleTotal, "条风控工单", apiMode)}
          searchPlaceholder="搜索标题、说明、任务、客户或登记人"
          searchValue={query}
        >
          <ToolbarSelect ariaLabel="按状态筛选风控工单" onChange={setStatusFilter} options={riskCaseStatusOptions} value={statusFilter} />
          <ToolbarSelect ariaLabel="按级别筛选风控工单" onChange={setSeverityFilter} options={riskCaseSeverityOptions} value={severityFilter} />
          <ToolbarSelect ariaLabel="按来源筛选风控工单" onChange={setSourceFilter} options={riskCaseSourceOptions} value={sourceFilter} />
          <ToolbarSelect ariaLabel="风控排序" onChange={setSort} options={riskCaseSortOptions} value={sort} />
        </ListToolbar>
        {listError ? <InlineError text={listError} /> : null}
        {actionError ? <div className="mt-3"><InlineError text={actionError} /></div> : null}
        {visibleRiskCases.length ? (
          <div className={lexosUi.tableWrap}>
            <table className={`${lexosUi.table} min-w-[1620px]`}>
              <thead className={lexosUi.tableHead}>
                <tr>
                  <th className="px-3 py-2.5 font-semibold">工单</th>
                  <th className="px-3 py-2.5 font-semibold">状态</th>
                  <th className="px-3 py-2.5 font-semibold">级别</th>
                  <th className="px-3 py-2.5 font-semibold">来源</th>
                  <th className="px-3 py-2.5 font-semibold">任务 / 客户 / 建议扣减</th>
                  <th className="px-3 py-2.5 font-semibold">登记 / 处理</th>
                  <th className="px-3 py-2.5 font-semibold">时间</th>
                  <th className="px-3 py-2.5 font-semibold">48 小时答辩</th>
                  <th className="px-3 py-2.5 font-semibold">委员会裁决</th>
                  <th className="px-3 py-2.5 font-semibold">处理</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibleRiskCases.map((riskCase) => {
                  const isPending = pendingRiskCaseId === riskCase.id;
                  const isDefensePending = pendingDefenseRiskCaseId === riskCase.id;
                  const isDecisionPending = pendingDecisionRiskCaseId === riskCase.id;
                  const reporterName = riskCase.reporterName ?? usersById.get(riskCase.reportedByUserId ?? "")?.displayName ?? "系统";
                  const ownerName = riskCase.ownerName ?? usersById.get(riskCase.ownerUserId ?? "")?.displayName ?? "-";
                  const resolutionDraft = resolutionDrafts[riskCase.id] ?? "";
                  const defenseDraft = defenseDrafts[riskCase.id] ?? "";
                  const linkedTask = riskCase.taskId ? taskById.get(riskCase.taskId) : undefined;
                  const deductionPreview = linkedTask
                    ? calculateRiskDeductionPreview(linkedTask.amountCents, riskCase.severity, riskDeductionRates)
                    : null;
                  const defenseStatus = buildRiskCaseDefenseStatus({
                    createdAt: riskCase.rawCreatedAt ?? riskCase.createdAt,
                    defendedAt: riskCase.defendedAt,
                    status: riskCase.status,
                  });
                  const decisionDraft = decisionDrafts[riskCase.id] ?? {
                    decision: "warning" as RiskCaseCommitteeDecision,
                    deductionBasisPoints: riskCase.committeeDeductionBasisPoints ?? 500,
                    note: "",
                  };
                  const committeePermission = canSubmitCommitteeDecision({
                    defenseOverdue: defenseStatus.overdue,
                    defenseSubmitted: defenseStatus.submitted,
                    existingDecision: riskCase.committeeDecision,
                    status: riskCase.status,
                  });
                  const maySubmitDefense =
                    canSubmitRiskCaseDefense(currentUser, riskCase, linkedTask) && defenseStatus.canSubmit;
                  const maySubmitDecision = canDecideRiskCases && committeePermission.allowed;

                  return (
                    <tr className="align-top hover:bg-canvas/70" key={riskCase.id}>
                      <td className="max-w-72 px-3 py-2.5">
                        <div className="font-semibold text-ink">{riskCase.title}</div>
                        {riskCase.description ? (
                          <div className="mt-1 line-clamp-2 text-[12px] leading-5 text-steel">{riskCase.description}</div>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <RiskCaseStatusBadge status={riskCase.status} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate">{riskCaseSeverityLabels[riskCase.severity]}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate">{riskCaseSourceLabels[riskCase.source]}</td>
                      <td className="max-w-60 px-3 py-2.5">
                        <div className="font-medium text-ink">{linkedTask?.title ?? riskCase.taskTitle ?? "-"}</div>
                        <div className="mt-1 text-[12px] text-steel">{riskCase.customerName ?? "-"}</div>
                        {deductionPreview ? (
                          <div className="mt-1 text-[11px] leading-5 text-rose-700">
                            {riskDeductionPreviewText(deductionPreview)}
                          </div>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <div className="font-medium text-ink">{reporterName}</div>
                        <div className="mt-1 text-[12px] text-steel">处理人：{ownerName}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate">
                        <div>{riskCase.createdAt}</div>
                        <div className="mt-1 text-[12px] text-steel">更新：{riskCase.updatedAt ?? riskCase.createdAt}</div>
                      </td>
                      <td className="w-80 px-3 py-2.5">
                        <div className="space-y-2">
                          <div className="rounded-md bg-canvas px-2 py-1.5 text-[12px] leading-5 text-slate">
                            <span className={defenseStatus.overdue && !defenseStatus.submitted ? "font-semibold text-rose-700" : "font-semibold text-ink"}>
                              {riskCaseDefenseStatusText(defenseStatus)}
                            </span>
                            {defenseStatus.deadlineAt ? (
                              <span className="block text-[11px] text-steel">
                                截止：{formatDateTimeText(defenseStatus.deadlineAt)}
                              </span>
                            ) : null}
                          </div>
                          {riskCase.defenseStatement ? (
                            <div className="rounded-md border border-teal/20 bg-teal/10 px-2 py-1.5 text-[12px] leading-5 text-teal">
                              {riskCase.defenseStatement}
                              {riskCase.defendedAt ? (
                                <span className="mt-1 block text-[11px] text-steel">
                                  提交：{formatDateTimeText(riskCase.defendedAt)}
                                </span>
                              ) : null}
                            </div>
                          ) : maySubmitDefense ? (
                            <>
                              <textarea
                                aria-label={`${riskCase.title} 答辩说明`}
                                className={`${lexosUi.input} h-16 resize-y py-2`}
                                disabled={isDefensePending}
                                onChange={(event) =>
                                  setDefenseDrafts((items) => ({ ...items, [riskCase.id]: event.target.value }))
                                }
                                placeholder="填写事实说明、已补救动作和佐证线索"
                                value={defenseDraft}
                              />
                              <button
                                className={actionButtonClass("primary", "sm")}
                                disabled={isDefensePending}
                                onClick={() => void handleDefenseSubmit(riskCase)}
                                type="button"
                              >
                                {isDefensePending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Gavel className="h-3.5 w-3.5" />}
                                提交答辩
                              </button>
                            </>
                          ) : (
                            <div className="text-[12px] leading-5 text-steel">
                              {isLawyerRole(currentUser.role) ? "当前不可提交答辩。" : "等待承办律师答辩。"}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="w-80 px-3 py-2.5">
                        <div className="space-y-2">
                          <div className="rounded-md bg-canvas px-2 py-1.5 text-[12px] leading-5 text-slate">
                            <span className="font-semibold text-ink">{riskCaseCommitteeDecisionText(riskCase)}</span>
                            {riskCase.committeeDecidedAt ? (
                              <span className="block text-[11px] text-steel">
                                {riskCase.committeeDeciderName ?? "委员会"} · {formatDateTimeText(riskCase.committeeDecidedAt)}
                              </span>
                            ) : committeePermission.reason ? (
                              <span className="block text-[11px] text-steel">{committeePermission.reason}</span>
                            ) : null}
                          </div>
                          {riskCase.committeeDecisionNote ? (
                            <div className="rounded-md border border-navy/10 bg-white px-2 py-1.5 text-[12px] leading-5 text-slate">
                              {riskCase.committeeDecisionNote}
                            </div>
                          ) : maySubmitDecision ? (
                            <>
                              <SelectInput
                                label="裁决"
                                onChange={(value) =>
                                  setDecisionDrafts((items) => ({
                                    ...items,
                                    [riskCase.id]: {
                                      ...decisionDraft,
                                      decision: value as RiskCaseCommitteeDecision,
                                    },
                                  }))
                                }
                                options={[
                                  ["warning", riskCaseCommitteeDecisionLabels.warning],
                                  ["no_fault", riskCaseCommitteeDecisionLabels.no_fault],
                                  ["deduction", riskCaseCommitteeDecisionLabels.deduction],
                                  ["escalation", riskCaseCommitteeDecisionLabels.escalation],
                                ]}
                                value={decisionDraft.decision}
                              />
                              {decisionDraft.decision === "deduction" ? (
                                <label className="block text-[12px]">
                                  <span className="font-medium text-slate">扣减基点</span>
                                  <input
                                    className={`${lexosUi.input} mt-1`}
                                    max={10000}
                                    min={1}
                                    onChange={(event) =>
                                      setDecisionDrafts((items) => ({
                                        ...items,
                                        [riskCase.id]: {
                                          ...decisionDraft,
                                          deductionBasisPoints: Number(event.target.value),
                                        },
                                      }))
                                    }
                                    type="number"
                                    value={decisionDraft.deductionBasisPoints}
                                  />
                                </label>
                              ) : null}
                              <textarea
                                aria-label={`${riskCase.title} 委员会裁决意见`}
                                className={`${lexosUi.input} h-16 resize-y py-2`}
                                disabled={isDecisionPending}
                                onChange={(event) =>
                                  setDecisionDrafts((items) => ({
                                    ...items,
                                    [riskCase.id]: {
                                      ...decisionDraft,
                                      note: event.target.value,
                                    },
                                  }))
                                }
                                placeholder="记录裁决依据、是否采纳答辩和后续处理"
                                value={decisionDraft.note}
                              />
                              <button
                                className={actionButtonClass("teal", "sm")}
                                disabled={isDecisionPending}
                                onClick={() => void handleCommitteeDecisionSubmit(riskCase)}
                                type="button"
                              >
                                {isDecisionPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                                提交裁决
                              </button>
                            </>
                          ) : (
                            <div className="text-[12px] leading-5 text-steel">
                              {riskCase.committeeDecision ? "裁决已记录。" : "等待委员会裁决。"}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="w-72 px-3 py-2.5">
                        <div className="space-y-2">
                          {!canUpdateRiskCaseStatus ? (
                            <span className="text-[12px] text-steel">无处理权限</span>
                          ) : riskCase.status === "resolved" ? (
                            <div className="rounded-md bg-canvas px-2 py-1.5 text-[12px] leading-5 text-slate">
                              {riskCase.resolutionNote ?? "已办结，暂无处理意见。"}
                            </div>
                          ) : (
                            <textarea
                              aria-label={`${riskCase.title} 处理意见`}
                              className={`${lexosUi.input} h-16 resize-y py-2`}
                              disabled={isPending}
                              onChange={(event) =>
                                setResolutionDrafts((items) => ({ ...items, [riskCase.id]: event.target.value }))
                              }
                              placeholder="记录处理意见"
                              value={resolutionDraft}
                            />
                          )}
                          <div className="flex flex-wrap gap-2">
                            {riskCase.status === "open" ? (
                              <button
                                className={actionButtonClass("secondary", "sm")}
                                disabled={isPending}
                                onClick={() => void handleStatusAction(riskCase, "start_review")}
                                type="button"
                              >
                                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock3 className="h-3.5 w-3.5" />}
                                开始处理
                              </button>
                            ) : null}
                            {riskCase.status !== "resolved" ? (
                              <button
                                className={actionButtonClass("teal", "sm")}
                                disabled={isPending}
                                onClick={() => void handleStatusAction(riskCase, "resolve")}
                                type="button"
                              >
                                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                办结
                              </button>
                            ) : (
                              <button
                                className={actionButtonClass("secondary", "sm")}
                                disabled={isPending}
                                onClick={() => void handleStatusAction(riskCase, "reopen")}
                                type="button"
                              >
                                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                                重新打开
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="暂无匹配的风控工单。" />
        )}
        <Pagination
          currentPage={visibleCurrentPage}
          onPageChange={setPage}
          pageSize={visiblePageSize}
          total={visibleTotal}
          totalPages={visibleTotalPages}
        />
      </Panel>
    </div>
  );
}

function SettingsPage({
  onSave,
  settings,
}: {
  onSave: (settings: Array<{ key: string; value: SystemSettingValue }>) => MaybePromise<void>;
  settings: SystemSettingItem[];
}) {
  const [draft, setDraft] = useState<Record<string, SystemSettingValue>>(() =>
    Object.fromEntries(settings.map((setting) => [setting.key, setting.value])),
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(Object.fromEntries(settings.map((setting) => [setting.key, setting.value])));
  }, [settings]);

  function updateDraft(key: string, value: SystemSettingValue) {
    setDraft((items) => ({ ...items, [key]: value }));
  }

  async function save() {
    setIsSaving(true);

    try {
      await onSave(settings.map((setting) => ({ key: setting.key, value: draft[setting.key] ?? setting.defaultValue })));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader description="组织级运营参数，第一版先沉淀配置入口和审计记录。" title="系统参数" />
      <Panel title="参数配置">
        <div className={lexosUi.tableWrap}>
          <table className={`${lexosUi.table} min-w-[920px]`}>
            <thead className={lexosUi.tableHead}>
              <tr>
                <th className="px-3 py-2.5 font-semibold">参数</th>
                <th className="px-3 py-2.5 font-semibold">当前值</th>
                <th className="px-3 py-2.5 font-semibold">默认值</th>
                <th className="px-3 py-2.5 font-semibold">说明</th>
                <th className="px-3 py-2.5 font-semibold">更新时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {settings.map((setting) => (
                <tr className="align-top hover:bg-canvas/70" key={setting.key}>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div className="font-semibold text-ink">{setting.label}</div>
                    <div className="mt-1 font-mono text-[11px] text-steel">{setting.key}</div>
                  </td>
                  <td className="px-3 py-3">
                    <SettingControl setting={setting} value={draft[setting.key] ?? setting.defaultValue} onChange={updateDraft} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate">{formatSettingValue(setting.defaultValue)}</td>
                  <td className="max-w-md px-3 py-3 leading-5 text-steel">{setting.description}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-slate">{setting.updatedAt ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            className={actionButtonClass("primary")}
            disabled={isSaving}
            onClick={save}
            type="button"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSaving ? "保存中" : "保存参数"}
          </button>
        </div>
      </Panel>
    </div>
  );
}

function PermissionsPage() {
  const permissionPairs = internalUserRoleOptions.reduce((sum, [role]) => sum + getAccessibleMenuItems(role).length, 0);

  return (
    <div className="space-y-4">
      <PageHeader description="集中查看内部角色的菜单入口、默认入口和当前权限覆盖。" title="角色权限" />
      <div className="grid gap-3 md:grid-cols-3">
        <Metric icon={UsersRound} label="内部角色" value={`${internalUserRoleOptions.length}`} />
        <Metric icon={LayoutDashboard} label="菜单入口" value={`${menuPermissionItems.length}`} />
        <Metric icon={ShieldCheck} label="授权关系" value={`${permissionPairs}`} />
      </div>
      <Panel title="角色能力摘要">
        <DataTable
          headers={["角色", "默认入口", "可见菜单", "职责口径"]}
          rows={internalUserRoleOptions.map(([role, label]) => {
            const accessibleMenus = getAccessibleMenuItems(role);

            return [
              label,
              menuPermissionItems.find((item) => item.key === getDefaultMenuKey(role))?.label ?? "总览",
              accessibleMenus.map((item) => item.label).join("、"),
              roleDescriptions[role],
            ];
          })}
        />
      </Panel>
      <Panel title="菜单权限矩阵">
        <div className={lexosUi.tableWrap}>
          <table className={`${lexosUi.table} min-w-[1120px]`}>
            <thead className={lexosUi.tableHead}>
              <tr>
                <th className="px-3 py-2.5 font-semibold">角色</th>
                {menuPermissionItems.map((item) => (
                  <th className="px-3 py-2.5 text-center font-semibold" key={item.key}>
                    {item.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {internalUserRoleOptions.map(([role, label]) => (
                <tr className="hover:bg-canvas/70" key={role}>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div className="font-semibold text-ink">{label}</div>
                    <div className="mt-1 text-[11px] text-steel">{role}</div>
                  </td>
                  {menuPermissionItems.map((item) => {
                    const allowed = item.roles.includes(role);

                    return (
                      <td className="px-3 py-3 text-center" key={item.key}>
                        <span
                          aria-label={`${label}${allowed ? "可以访问" : "不能访问"}${item.label}`}
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-md border ${
                            allowed ? "border-teal/20 bg-teal/10 text-teal" : "border-line bg-canvas text-steel"
                          }`}
                          title={item.description}
                        >
                          {allowed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <LockKeyhole className="h-3.5 w-3.5" />}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {menuPermissionItems.map((item) => (
            <div className="rounded-md border border-line bg-canvas/60 px-3 py-2.5" key={item.key}>
              <div className="flex items-center justify-between gap-3">
                <div className="text-[13px] font-semibold text-ink">{item.label}</div>
                <div className="text-[11px] font-medium text-steel">{item.roles.length} 个角色</div>
              </div>
              <div className="mt-1 text-[12px] leading-5 text-steel">{item.description}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function SettingControl({
  onChange,
  setting,
  value,
}: {
  onChange: (key: string, value: SystemSettingValue) => void;
  setting: SystemSettingItem;
  value: SystemSettingValue;
}) {
  if (setting.type === "boolean") {
    return (
      <label className="inline-flex h-11 items-center gap-2 rounded-md border border-line bg-canvas px-3 text-[13px] font-medium text-slate">
        <input
          checked={Boolean(value)}
          className="h-4 w-4 accent-teal"
          onChange={(event) => onChange(setting.key, event.target.checked)}
          type="checkbox"
        />
        {Boolean(value) ? "启用" : "停用"}
      </label>
    );
  }

  if (setting.type === "number") {
    return (
      <input
        className={`${lexosUi.inputBare} w-36`}
        max={setting.max}
        min={setting.min}
        onChange={(event) => onChange(setting.key, Number(event.target.value))}
        type="number"
        value={Number(value)}
      />
    );
  }

  return (
    <input
      className={`${lexosUi.inputBare} w-52`}
      onChange={(event) => onChange(setting.key, event.target.value)}
      value={String(value)}
    />
  );
}

function formatSettingValue(value: SystemSettingValue): string {
  if (typeof value === "boolean") {
    return value ? "启用" : "停用";
  }

  return String(value);
}

function AuditPage({ apiMode, logs, refreshKey }: { apiMode: boolean; logs: AuditLog[]; refreshKey: number }) {
  const [query, setQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sort, setSort] = useState("createdAtDesc");
  const [page, setPage] = useState(1);
  const [serverLogs, setServerLogs] = useState<AuditLog[]>(logs);
  const [serverReportLogs, setServerReportLogs] = useState<AuditLog[]>(logs);
  const [serverPagination, setServerPagination] = useState<ApiPagination>(() =>
    fallbackPagination(1, TABLE_PAGE_SIZE, logs.length),
  );
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const filteredLogs = logs.filter(
    (log) =>
      (entityFilter === "all" || log.entityType === entityFilter) &&
      (actionFilter === "all" || log.actionCode === actionFilter || log.action === actionFilter) &&
      isAuditLogInDateRange(log, startDate, endDate) &&
      matchesSearch(query, log.createdAt, log.actor, log.action, log.actionCode, log.entity),
  );
  const sortedLogs = sortDemoItems(filteredLogs, sort, {
    actionAsc: { direction: "asc", select: (log) => log.actionCode ?? log.action },
    createdAtAsc: { direction: "asc", select: (log) => log.rawCreatedAt ?? log.createdAt },
    createdAtDesc: { direction: "desc", select: (log) => log.rawCreatedAt ?? log.createdAt },
    entityTypeAsc: { direction: "asc", select: (log) => log.entityType },
  });
  const logPage = paginateItems(sortedLogs, page);
  const visibleLogs = apiMode ? serverLogs : logPage.items;
  const visibleCurrentPage = apiMode ? serverPagination.page : logPage.currentPage;
  const visiblePageSize = apiMode ? serverPagination.pageSize : logPage.pageSize;
  const visibleTotal = apiMode ? serverPagination.total : logPage.total;
  const visibleTotalPages = apiMode ? serverPagination.totalPages : logPage.totalPages;
  const auditListParams: ApiListParams = {
    action: actionFilter,
    endDate,
    entityType: entityFilter,
    page,
    pageSize: TABLE_PAGE_SIZE,
    search: query,
    sort,
    startDate,
  };
  const exportPath = apiBuildAuditLogExportPath(auditListParams);
  const reportLogs = apiMode ? serverReportLogs : sortedLogs;
  const auditReport = buildAuditReport(reportLogs);
  const reportScopeText = apiMode
    ? `报表基于当前筛选条件下最近 ${serverReportLogs.length} 条日志${
        serverPagination.total > serverReportLogs.length ? ` / 服务端共 ${serverPagination.total} 条` : ""
      }`
    : `报表基于当前筛选后的 ${sortedLogs.length} 条日志`;

  useEffect(() => {
    setPage(1);
  }, [actionFilter, endDate, entityFilter, query, sort, startDate]);

  useEffect(() => {
    if (!apiMode) {
      return;
    }

    let active = true;

    async function loadAuditLogsPage() {
      setIsLoadingList(true);
      setListError(null);

      try {
        const [result, reportResult] = await Promise.all([
          apiFetchAuditLogsPage(auditListParams),
          apiFetchAuditLogsPage({
            ...auditListParams,
            page: 1,
            pageSize: AUDIT_REPORT_MAX_ROWS,
          }),
        ]);

        if (!active) {
          return;
        }

        setServerLogs(result.items);
        setServerReportLogs(reportResult.items);
        setServerPagination(result.pagination);
      } catch (error) {
        if (active) {
          setListError(error instanceof Error ? error.message : "审计日志加载失败");
        }
      } finally {
        if (active) {
          setIsLoadingList(false);
        }
      }
    }

    void loadAuditLogsPage();

    return () => {
      active = false;
    };
    // auditListParams is rebuilt each render; explicit primitive deps keep the fetch stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter, apiMode, endDate, entityFilter, page, query, refreshKey, sort, startDate]);

  return (
    <div className="space-y-4">
      <PageHeader description="记录登录、配置、任务、风控、结算等关键操作，支持主任和配置管理员追溯。" title="审计日志" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={ShieldCheck} label="审计事件" value={`${auditReport.summary.totalCount}`} />
        <Metric icon={UsersRound} label="操作人" value={`${auditReport.summary.actorCount}`} />
        <Metric icon={FileText} label="覆盖模块" value={`${auditReport.summary.moduleCount}`} />
        <Metric icon={AlertTriangle} label="登录失败" value={`${auditReport.summary.failedLoginCount}`} />
      </div>
      <Panel title="审计报表">
        <div className="mb-3 flex flex-col gap-1 text-[12px] leading-5 text-steel sm:flex-row sm:items-center sm:justify-between">
          <span>{reportScopeText}</span>
          <span>单次报表最多统计 {AUDIT_REPORT_MAX_ROWS} 条日志</span>
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.8fr]">
          <DataTable
            emptyText="暂无可汇总的审计模块。"
            headers={["模块", "事件", "占比", "最近时间"]}
            rows={auditReport.moduleStats.slice(0, 6).map((stat) => [
              auditEntityLabel(stat.key),
              `${stat.count} 条`,
              `${stat.sharePercent}%`,
              formatAuditReportTime(stat.latestAt),
            ])}
          />
          <div>
            <Signal label="最高频模块" value={auditReport.summary.topModule ? auditEntityLabel(auditReport.summary.topModule.key) : "-"} />
            <Signal label="最高频动作" value={auditReport.summary.topAction ? auditActionLabel(auditReport.summary.topAction.key) : "-"} />
            <Signal label="最高频操作人" value={auditReport.summary.topActor?.actor ?? "-"} />
            <Signal label="客户侧事件" value={`${auditReport.summary.customerPortalEventCount} 条`} />
            <Signal label="安全事件" value={`${auditReport.summary.securityEventCount} 条`} />
          </div>
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <DataTable
            emptyText="暂无动作分布。"
            headers={["动作", "事件", "占比"]}
            rows={auditReport.actionStats.slice(0, 6).map((stat) => [
              auditActionLabel(stat.key),
              `${stat.count} 条`,
              `${stat.sharePercent}%`,
            ])}
          />
          <DataTable
            emptyText="暂无日期趋势。"
            headers={["日期", "事件"]}
            rows={auditReport.dailyStats.slice(-7).map((stat) => [stat.date, `${stat.count} 条`])}
          />
        </div>
      </Panel>
      <Panel title="操作记录">
        <ListToolbar
          onSearchChange={setQuery}
          resultText={isLoadingList ? "加载日志中..." : resultCountText(visibleTotal, "条日志", apiMode)}
          searchPlaceholder="搜索时间、操作者、动作或对象"
          searchValue={query}
        >
          <ToolbarSelect
            ariaLabel="按模块筛选日志"
            onChange={setEntityFilter}
            options={auditEntityOptions}
            value={entityFilter}
          />
          <ToolbarSelect
            ariaLabel="按动作筛选日志"
            onChange={setActionFilter}
            options={auditActionOptions}
            value={actionFilter}
          />
          <ToolbarSelect ariaLabel="审计排序" onChange={setSort} options={auditLogSortOptions} value={sort} />
          <ToolbarDateInput ariaLabel="开始日期" onChange={setStartDate} value={startDate} />
          <ToolbarDateInput ariaLabel="结束日期" onChange={setEndDate} value={endDate} />
          {apiMode ? (
            <a
              className={actionButtonClass("primary", "sm")}
              href={exportPath}
            >
              <Download className="h-3.5 w-3.5" />
              导出 CSV
            </a>
          ) : (
            <button
              className={actionButtonClass("secondary", "sm")}
              disabled
              type="button"
            >
              <Download className="h-3.5 w-3.5" />
              导出 CSV
            </button>
          )}
        </ListToolbar>
        {listError ? <InlineError text={listError} /> : null}
        <DataTable
          emptyText="没有匹配的审计日志。"
          headers={["时间", "操作者", "动作", "对象"]}
          rows={visibleLogs.map((log) => [log.createdAt, log.actor, log.action, log.entity])}
        />
        <Pagination
          currentPage={visibleCurrentPage}
          onPageChange={setPage}
          pageSize={visiblePageSize}
          total={visibleTotal}
          totalPages={visibleTotalPages}
        />
      </Panel>
    </div>
  );
}

function mergeCurrentUser(users: DemoUser[], currentUser: DemoUser): DemoUser[] {
  if (users.some((user) => user.id === currentUser.id)) {
    return users;
  }

  return [currentUser, ...users];
}

function mergeCustomersFromTasks(customers: Customer[], tasks: Task[]): Customer[] {
  const byId = new Map(customers.map((customer) => [customer.id, customer]));

  tasks.forEach((task) => {
    if (!task.customerId || byId.has(task.customerId) || !task.customerName) {
      return;
    }

    byId.set(task.customerId, {
      id: task.customerId,
      name: task.customerName,
      contactName: "-",
      phone: "",
      source: "任务关联",
    });
  });

  return Array.from(byId.values());
}

function isAuditLogInDateRange(log: AuditLog, startDate: string, endDate: string): boolean {
  const dateText = log.rawCreatedAt?.slice(0, 10) ?? log.createdAt.slice(0, 10);

  if (startDate && dateText < startDate) {
    return false;
  }

  if (endDate && dateText > endDate) {
    return false;
  }

  return true;
}

function auditEntityLabel(entityType: string): string {
  return auditEntityOptions.find(([value]) => value === entityType)?.[1] ?? entityType;
}

function auditActionLabel(actionCode: string): string {
  return auditActionOptions.find(([value]) => value === actionCode)?.[1] ?? actionCode;
}

function formatAuditReportTime(value: string | undefined): string {
  return value ? formatDateTimeText(value) : "-";
}

type ActionButtonTone = "danger" | "ghost" | "primary" | "secondary" | "teal" | "tealSoft" | "warning";
type ActionButtonSize = "md" | "sm";

function actionButtonClass(tone: ActionButtonTone = "primary", size: ActionButtonSize = "md", className = ""): string {
  const sizeClass = size === "sm" ? "h-10 px-3 text-[12px]" : "h-11 px-3.5 text-[13px]";
  const toneClass =
    tone === "teal"
      ? "bg-teal text-white hover:bg-teal/90 disabled:bg-slate/40"
      : tone === "tealSoft"
        ? "border border-teal/20 bg-teal/10 text-teal hover:bg-teal/15 disabled:border-line disabled:bg-canvas disabled:text-slate/40"
      : tone === "secondary"
        ? "border border-line bg-white text-slate hover:border-steel/50 hover:bg-canvas disabled:text-slate/40"
        : tone === "danger"
          ? "bg-rose-700 text-white hover:bg-rose-800 disabled:bg-slate/40"
          : tone === "warning"
            ? "border border-amber-200 bg-amber-50 text-amber-900 hover:bg-white disabled:text-amber-900/40"
            : tone === "ghost"
              ? "text-slate hover:bg-canvas disabled:text-slate/40"
              : "bg-navy text-white hover:bg-ink disabled:bg-slate/40";

  return `focus-ring inline-flex items-center justify-center gap-2 rounded-md font-semibold transition ${sizeClass} ${toneClass} ${className}`;
}

function PageHeader({ description, title }: { description: string; title: string }) {
  return (
    <div className="flex flex-col gap-2 border-b border-line pb-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[20px] font-semibold leading-7 tracking-normal text-ink">{title}</h1>
        <p className="mt-1 max-w-3xl text-[13px] leading-5 text-steel">{description}</p>
      </div>
      <div className="hidden h-7 items-center rounded-md border border-line bg-white px-2.5 text-[11px] font-semibold uppercase text-steel sm:flex">
        Lexos Ops
      </div>
    </div>
  );
}

function Panel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className={lexosUi.panel}>
      <div className={lexosUi.panelHeader}>
        <h2 className={lexosUi.panelTitle}>{title}</h2>
      </div>
      <div className={lexosUi.panelBody}>
        {children}
      </div>
    </section>
  );
}

function OperationsCue({
  detail,
  label,
  tone,
  value,
}: {
  detail: string;
  label: string;
  tone: "gold" | "ink" | "rose" | "teal";
  value: string;
}) {
  const toneClass =
    tone === "teal"
      ? "border-teal/25 bg-teal/10 text-teal"
      : tone === "gold"
        ? "border-gold/25 bg-gold/10 text-gold"
        : tone === "rose"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-navy/15 bg-navy/5 text-navy";

  return (
    <div className={`rounded-md border px-3 py-2.5 ${toneClass}`}>
      <div className="text-[12px] font-semibold">{label}</div>
      <div className="mt-0.5 text-[20px] font-semibold leading-6 tabular-nums">{value}</div>
      <div className="mt-0.5 text-[12px] leading-5 text-slate">{detail}</div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-paper p-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:border-steel/40">
      <div className="flex items-center justify-between">
        <div className="text-[12px] font-medium text-steel">{label}</div>
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal/10 text-teal">
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="mt-1.5 text-[21px] font-semibold leading-7 tabular-nums">{value}</div>
    </div>
  );
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-2 first:pt-0 last:border-b-0 last:pb-0">
      <span className="text-[13px] text-steel">{label}</span>
      <span className="text-right text-[13px] font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const tone =
    status === "open"
      ? "border-gold/20 bg-gold/10 text-gold"
      : status === "settled"
        ? "border-teal/20 bg-teal/10 text-teal"
        : "border-slate/20 bg-slate/10 text-slate";

  return <span className={`inline-flex min-h-6 items-center rounded-md border px-2 text-[11px] font-semibold ${tone}`}>{statusLabels[status]}</span>;
}

function RiskCaseStatusBadge({ status }: { status: RiskCase["status"] }) {
  const tone =
    status === "open"
      ? "border-gold/20 bg-gold/10 text-gold"
      : status === "resolved"
        ? "border-teal/20 bg-teal/10 text-teal"
        : "border-navy/20 bg-navy/10 text-navy";

  return (
    <span className={`inline-flex min-h-6 items-center rounded-md border px-2 text-[11px] font-semibold ${tone}`}>
      {riskCaseStatusLabels[status]}
    </span>
  );
}

function TextInput({
  disabled,
  label,
  onChange,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block text-[12px]">
      <span className="font-medium text-slate">{label}</span>
      <input
        className={lexosUi.input}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function SelectInput({
  disabled,
  label,
  onChange,
  options,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  options: string[][];
  value: string;
}) {
  return (
    <label className="block text-[12px]">
      <span className="font-medium text-slate">{label}</span>
      <select
        className={lexosUi.input}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function ListToolbar({
  children,
  onSearchChange,
  resultText,
  searchPlaceholder,
  searchValue,
}: {
  children?: ReactNode;
  onSearchChange: (value: string) => void;
  resultText: string;
  searchPlaceholder: string;
  searchValue: string;
}) {
  return (
    <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <label className="relative block sm:w-96">
          <span className="sr-only">搜索</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
          <input
            className={`${lexosUi.inputBare} w-full pl-9 pr-3 text-ink placeholder:text-steel`}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            value={searchValue}
          />
        </label>
        {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
      </div>
      <div className="rounded-md border border-line bg-canvas px-2.5 py-1.5 text-[12px] font-medium text-steel">{resultText}</div>
    </div>
  );
}

function ToolbarSelect({
  ariaLabel,
  onChange,
  options,
  value,
}: {
  ariaLabel: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
  value: string;
}) {
  return (
    <label className="flex h-11 items-center gap-2 rounded-md border border-line bg-white px-2.5 text-[12px] text-slate">
      <SlidersHorizontal className="h-3.5 w-3.5 text-steel" />
      <span className="sr-only">{ariaLabel}</span>
      <select
        aria-label={ariaLabel}
        className="h-10 bg-transparent text-[13px] outline-none"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToolbarDateInput({
  ariaLabel,
  onChange,
  value,
}: {
  ariaLabel: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="flex h-11 items-center gap-2 rounded-md border border-line bg-white px-2.5 text-[12px] text-slate">
      <Clock3 className="h-3.5 w-3.5 text-steel" />
      <span className="sr-only">{ariaLabel}</span>
      <input
        aria-label={ariaLabel}
        className="h-10 bg-transparent text-[13px] outline-none"
        onChange={(event) => onChange(event.target.value)}
        type="date"
        value={value}
      />
    </label>
  );
}

function Pagination({
  currentPage,
  onPageChange,
  pageSize,
  total,
  totalPages,
}: {
  currentPage: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  total: number;
  totalPages: number;
}) {
  if (total <= pageSize) {
    return null;
  }

  const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-[12px] text-steel">
        {start}-{end} / {total}
      </div>
      <div className="flex items-center gap-1">
        <button
          aria-label="上一页"
          className="focus-ring flex h-11 w-11 items-center justify-center rounded-md border border-line bg-white text-slate transition hover:border-steel/50 hover:bg-canvas disabled:opacity-40"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex h-11 min-w-20 items-center justify-center rounded-md border border-line bg-canvas px-2 text-[12px] font-semibold text-slate">
          {currentPage} / {totalPages}
        </div>
        <button
          aria-label="下一页"
          className="focus-ring flex h-11 w-11 items-center justify-center rounded-md border border-line bg-white text-slate transition hover:border-steel/50 hover:bg-canvas disabled:opacity-40"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          type="button"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const updateMatches = () => setMatches(mediaQuery.matches);

    updateMatches();
    mediaQuery.addEventListener("change", updateMatches);

    return () => {
      mediaQuery.removeEventListener("change", updateMatches);
    };
  }, [query]);

  return matches;
}

function DataTable({
  emptyText = "暂无数据。",
  headers,
  rows,
}: {
  emptyText?: string;
  headers: string[];
  rows: string[][];
}) {
  const compactTable = useMediaQuery("(max-width: 767px)");

  if (!rows.length) {
    return <EmptyState text={emptyText} />;
  }

  if (compactTable) {
    return (
      <div className="grid gap-2">
        {rows.map((row, rowIndex) => (
          <dl className="rounded-md border border-line bg-white p-3 shadow-[0_1px_0_rgba(15,23,42,0.02)]" key={`${row.join("-")}-${rowIndex}`}>
            {row.map((cell, cellIndex) => (
              <div
                className="grid gap-1 border-b border-line py-2 first:pt-0 last:border-b-0 last:pb-0"
                key={`${headers[cellIndex] ?? cellIndex}-${cell}-${cellIndex}`}
              >
                <dt className="text-[11px] font-semibold uppercase text-steel">{headers[cellIndex] ?? "字段"}</dt>
                <dd className="break-words text-[13px] font-medium leading-5 text-slate">{cell}</dd>
              </div>
            ))}
          </dl>
        ))}
      </div>
    );
  }

  return (
    <div className={lexosUi.tableWrap}>
      <table className={lexosUi.table}>
        <thead className={lexosUi.tableHead}>
          <tr>
            {headers.map((header) => (
              <th className="whitespace-nowrap px-3 py-2.5 font-semibold" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row, rowIndex) => (
            <tr className="odd:bg-white even:bg-[#FBFCFE] hover:bg-canvas/70" key={`${row.join("-")}-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td className="whitespace-nowrap px-3 py-2.5 text-slate first:font-medium first:text-ink" key={`${cell}-${cellIndex}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ text, title = "暂无数据" }: { text: string; title?: string }) {
  return (
    <div className="rounded-md border border-dashed border-line bg-canvas/60 px-4 py-8 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md border border-line bg-white text-steel">
        <ClipboardList className="h-4 w-4" />
      </div>
      <div className="mt-3 text-[13px] font-semibold text-slate">{title}</div>
      <div className="mt-1 text-[13px] leading-5 text-steel">{text}</div>
    </div>
  );
}

function InlineError({ className = "mb-3", text }: { className?: string; text: string }) {
  return (
    <div className={`${className} rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700`} role="alert">
      {text}
    </div>
  );
}
