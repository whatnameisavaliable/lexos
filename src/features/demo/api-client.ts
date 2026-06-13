import { requireKnownUserRole, type TaskStatus, type UserRole } from "@/lib/domain/core";
import type { RiskCaseAction } from "@/lib/risk/cases";
import type { RiskCaseCommitteeDecision } from "@/lib/risk/committee-decision";
import type { FundSummaryItem } from "@/lib/funds/ledger";
import type { SettlementRiskPenaltyDestination } from "@/lib/settlements/risk-deduction";
import type { SystemSettingItem, SystemSettingValue } from "@/lib/settings/definitions";
import type { AuditLog, Customer, DemoUser, FundTransaction, Rank, RiskCase, Settlement, Task, TaskDeliverable } from "@/types/demo";
import { canCustomerDownloadDeliverable } from "@/lib/domain/portal";

type ApiEnvelope<T> =
  | {
      data: T;
      message: string;
    }
  | {
      error: {
        code: string;
        message: string;
      };
    };

type PortalTokenMap = Record<string, string>;

export type ApiPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type ApiListParams = {
  action?: string;
  accountType?: string;
  endDate?: string;
  entityType?: string;
  minRankId?: string;
  page?: number;
  pageSize?: number;
  role?: string;
  search?: string;
  severity?: string;
  scope?: string;
  sort?: string;
  source?: string;
  startDate?: string;
  status?: string;
};

export type ApiListResult<T> = {
  items: T[];
  pagination: ApiPagination;
};

export type ApiFundListResult = ApiListResult<FundTransaction> & {
  summary: FundSummaryItem[];
};

export type ApiPortalSnapshot = {
  taskId: string;
  title: string;
  description: string;
  status: TaskStatus;
  customerName: string;
  deliverables: TaskDeliverable[];
  submittedTitle?: string;
  submittedContent?: string;
  externalUrl?: string;
};

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const timeoutMs = init?.method ? 30_000 : 8_000;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  const isFormDataBody = typeof FormData !== "undefined" && init?.body instanceof FormData;

  const response = await fetch(path, {
    credentials: "same-origin",
    signal: controller.signal,
    ...init,
    headers: {
      ...(init?.body && !isFormDataBody ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  }).finally(() => {
    window.clearTimeout(timeout);
  });
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !payload || "error" in payload) {
    const message = payload && "error" in payload ? payload.error.message : `请求失败（${response.status}）`;
    throw new Error(message);
  }

  return payload.data;
}

export function buildListPath(path: string, params: ApiListParams = {}): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();

  return query ? `${path}?${query}` : path;
}

export async function apiLogin(username: string, password: string): Promise<{ user: DemoUser; mustChangePassword: boolean }> {
  const data = await apiRequest<{ user: unknown; mustChangePassword: boolean }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  return {
    user: mapSessionUser(data.user),
    mustChangePassword: data.mustChangePassword,
  };
}

export async function apiFetchCurrentUser(): Promise<DemoUser> {
  const data = await apiRequest<{ user: unknown }>("/api/auth/me");

  return mapSessionUser(data.user);
}

export async function apiChangePassword(newPassword: string): Promise<void> {
  await apiRequest("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ newPassword }),
  });
}

export async function apiLogout(): Promise<void> {
  await apiRequest("/api/auth/logout", { method: "POST" });
}

export async function apiFetchRanks(): Promise<Rank[]> {
  const data = await apiRequest<{ ranks: unknown[] }>("/api/ranks");

  return data.ranks.map(mapApiRank);
}

export async function apiFetchUsersPage(params?: ApiListParams): Promise<ApiListResult<DemoUser>> {
  const data = await apiRequest<{ pagination?: unknown; users: unknown[] }>(buildListPath("/api/users", params));

  return {
    items: data.users.map(mapApiUser),
    pagination: mapApiPagination(data.pagination, params),
  };
}

export async function apiFetchUsers(params?: ApiListParams): Promise<DemoUser[]> {
  const result = await apiFetchUsersPage(params);

  return result.items;
}

export async function apiCreateUser(input: {
  username: string;
  displayName: string;
  roleCode: UserRole;
  rankId?: string;
}): Promise<void> {
  await apiRequest("/api/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function apiUpdateUser(
  userId: string,
  input: {
    rankId?: string;
    roleCode: UserRole;
    status: DemoUser["status"];
  },
): Promise<void> {
  await apiRequest(`/api/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function apiFetchCustomersPage(params?: ApiListParams): Promise<ApiListResult<Customer>> {
  const data = await apiRequest<{ customers: unknown[]; pagination?: unknown }>(buildListPath("/api/customers", params));

  return {
    items: data.customers.map(mapApiCustomer),
    pagination: mapApiPagination(data.pagination, params),
  };
}

export async function apiFetchCustomers(params?: ApiListParams): Promise<Customer[]> {
  const result = await apiFetchCustomersPage(params);

  return result.items;
}

export async function apiCreateCustomer(input: {
  name: string;
  contactName: string;
  phone: string;
  source: string;
}): Promise<void> {
  await apiRequest("/api/customers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function apiFetchTasksPage(
  ranks: Rank[],
  portalTokens: PortalTokenMap,
  params?: ApiListParams,
): Promise<ApiListResult<Task>> {
  const data = await apiRequest<{ pagination?: unknown; tasks: unknown[] }>(buildListPath("/api/tasks", params));

  return {
    items: data.tasks.map((row) => mapApiTask(row, ranks, portalTokens)),
    pagination: mapApiPagination(data.pagination, params),
  };
}

export async function apiFetchTasks(ranks: Rank[], portalTokens: PortalTokenMap, params?: ApiListParams): Promise<Task[]> {
  const result = await apiFetchTasksPage(ranks, portalTokens, params);

  return result.items;
}

export async function apiCreateTask(input: {
  customerId: string;
  title: string;
  description: string;
  taskType: string;
  amountCents: number;
  minRankId?: string;
  dueAt: string;
  reviewLawyerId?: string;
  reviewRequired?: boolean;
}): Promise<{ taskId: string; portalToken: string }> {
  const data = await apiRequest<{ task: { id: string }; portalToken: string }>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return {
    taskId: data.task.id,
    portalToken: data.portalToken,
  };
}

export async function apiClaimTask(taskId: string): Promise<void> {
  await apiRequest(`/api/tasks/${taskId}/claim`, { method: "POST" });
}

export async function apiSubmitTask(
  taskId: string,
  input: { title: string; content: string; externalUrl: string; file?: File | null },
): Promise<void> {
  if (input.file) {
    const formData = new FormData();
    formData.set("title", input.title);
    formData.set("content", input.content);
    formData.set("externalUrl", input.externalUrl);
    formData.set("file", input.file);

    await apiRequest(`/api/tasks/${taskId}/deliverables`, {
      method: "POST",
      body: formData,
    });
    return;
  }

  await apiRequest(`/api/tasks/${taskId}/submit`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function apiApproveTask(
  taskId: string,
  input: {
    caseResultScore?: number;
    caseResultSummary?: string;
    sourceReviewComment?: string;
    sourceReviewScore?: number;
  } = {},
): Promise<void> {
  await apiRequest(`/api/tasks/${taskId}/approve`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function apiReviewTask(
  taskId: string,
  input: {
    comment?: string;
    decision: "approved" | "changes_requested";
  },
): Promise<void> {
  await apiRequest(`/api/tasks/${taskId}/review`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function apiFetchSettlementsPage(ranks: Rank[], params?: ApiListParams): Promise<ApiListResult<Settlement>> {
  const data = await apiRequest<{ pagination?: unknown; settlements: unknown[] }>(buildListPath("/api/settlements", params));

  return {
    items: data.settlements.map((row) => mapApiSettlement(row, ranks)),
    pagination: mapApiPagination(data.pagination, params),
  };
}

export async function apiFetchSettlements(ranks: Rank[], params?: ApiListParams): Promise<Settlement[]> {
  const result = await apiFetchSettlementsPage(ranks, params);

  return result.items;
}

export function apiBuildSettlementsExportPath(params?: ApiListParams): string {
  return buildListPath("/api/settlements/export", params);
}

export async function apiFetchFundsPage(params?: ApiListParams): Promise<ApiFundListResult> {
  const data = await apiRequest<{ pagination?: unknown; summary: unknown[]; transactions: unknown[] }>(
    buildListPath("/api/funds", params),
  );

  return {
    items: data.transactions.map(mapApiFundTransaction),
    pagination: mapApiPagination(data.pagination, params),
    summary: data.summary.map(mapApiFundSummary),
  };
}

export async function apiFetchAuditLogsPage(params?: ApiListParams): Promise<ApiListResult<AuditLog>> {
  const data = await apiRequest<{ logs: unknown[]; pagination?: unknown }>(buildListPath("/api/audit-logs", params));

  return {
    items: data.logs.map(mapApiAuditLog),
    pagination: mapApiPagination(data.pagination, params),
  };
}

export async function apiFetchAuditLogs(params?: ApiListParams): Promise<AuditLog[]> {
  const result = await apiFetchAuditLogsPage(params);

  return result.items;
}

export function apiBuildAuditLogExportPath(params?: ApiListParams): string {
  return buildListPath("/api/audit-logs/export", params);
}

export async function apiFetchRiskCasesPage(params?: ApiListParams): Promise<ApiListResult<RiskCase>> {
  const data = await apiRequest<{ pagination?: unknown; riskCases: unknown[] }>(buildListPath("/api/risk-cases", params));

  return {
    items: data.riskCases.map(mapApiRiskCase),
    pagination: mapApiPagination(data.pagination, params),
  };
}

export async function apiFetchRiskCases(params?: ApiListParams): Promise<RiskCase[]> {
  const result = await apiFetchRiskCasesPage(params);

  return result.items;
}

export async function apiCreateRiskCase(input: {
  customerId?: string;
  description?: string;
  severity: RiskCase["severity"];
  source: RiskCase["source"];
  taskId?: string;
  title: string;
}): Promise<RiskCase> {
  const data = await apiRequest<{ riskCase: unknown }>("/api/risk-cases", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return mapApiRiskCase(data.riskCase);
}

export async function apiUpdateRiskCaseStatus(
  riskCaseId: string,
  input: { action: RiskCaseAction; resolutionNote?: string },
): Promise<RiskCase> {
  const data = await apiRequest<{ riskCase: unknown }>(`/api/risk-cases/${riskCaseId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return mapApiRiskCase(data.riskCase);
}

export async function apiSubmitRiskCaseDefense(riskCaseId: string, defenseStatement: string): Promise<RiskCase> {
  const data = await apiRequest<{ riskCase: unknown }>(`/api/risk-cases/${riskCaseId}/defense`, {
    method: "POST",
    body: JSON.stringify({ defenseStatement }),
  });

  return mapApiRiskCase(data.riskCase);
}

export async function apiSubmitRiskCaseDecision(
  riskCaseId: string,
  input: { decision: RiskCaseCommitteeDecision; deductionBasisPoints?: number; note: string },
): Promise<RiskCase> {
  const data = await apiRequest<{ riskCase: unknown }>(`/api/risk-cases/${riskCaseId}/decision`, {
    method: "POST",
    body: JSON.stringify(input),
  });

  return mapApiRiskCase(data.riskCase);
}

export async function apiFetchSystemSettings(): Promise<SystemSettingItem[]> {
  const data = await apiRequest<{ settings: SystemSettingItem[] }>("/api/system-settings");

  return data.settings;
}

export async function apiUpdateSystemSettings(settings: Array<{ key: string; value: SystemSettingValue }>): Promise<SystemSettingItem[]> {
  const data = await apiRequest<{ settings: SystemSettingItem[] }>("/api/system-settings", {
    method: "PUT",
    body: JSON.stringify({ settings }),
  });

  return data.settings;
}

export async function apiConfirmSettlement(settlementId: string): Promise<void> {
  await apiRequest(`/api/settlements/${settlementId}/confirm`, { method: "POST" });
}

export async function apiConfirmSettlements(settlementIds: string[]): Promise<{ confirmedCount: number }> {
  return apiRequest<{ confirmedCount: number }>("/api/settlements/bulk-confirm", {
    method: "POST",
    body: JSON.stringify({ settlementIds }),
  });
}

export async function apiLockSettlementRiskDeduction(
  settlementId: string,
  input: {
    destination?: SettlementRiskPenaltyDestination;
    note?: string;
    riskCaseId?: string;
  },
): Promise<void> {
  await apiRequest(`/api/settlements/${settlementId}/risk-deduction`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function apiAutoConfirmOverdueTasks(): Promise<{
  autoConfirmDays: number;
  processedCount: number;
  skippedCount: number;
  taskIds: string[];
}> {
  return apiRequest<{
    autoConfirmDays: number;
    processedCount: number;
    skippedCount: number;
    taskIds: string[];
  }>("/api/tasks/auto-confirm-overdue", { method: "POST" });
}

export async function apiVerifyPortalCode(token: string, phone: string, code: string): Promise<ApiPortalSnapshot> {
  await apiRequest(`/api/customer-portal/${encodeURIComponent(token)}/verify-code`, {
    method: "POST",
    body: JSON.stringify({ phone, code }),
  });

  return apiFetchPortal(token);
}

export async function apiFetchPortal(token: string): Promise<ApiPortalSnapshot> {
  const data = await apiRequest<{ portal: unknown }>(`/api/customer-portal/${encodeURIComponent(token)}`);

  return mapApiPortal(data.portal, token);
}

export async function apiSubmitPortalFeedback(token: string, score: number, comment: string): Promise<void> {
  await apiRequest(`/api/customer-portal/${encodeURIComponent(token)}/feedback`, {
    method: "POST",
    body: JSON.stringify({ score, comment }),
  });
}

export function mapApiRank(row: unknown): Rank {
  const item = asRecord(row);

  return {
    id: text(item.id),
    code: text(item.code),
    name: text(item.name),
    settlementBasisPoints: number(item.settlement_basis_points),
    sortOrder: number(item.sort_order),
  };
}

export function mapApiUser(row: unknown): DemoUser {
  const item = asRecord(row);
  const profile = relation(item.profiles);
  const rank = relation(item.ranks);

  return {
    id: text(profile.id),
    username: text(profile.username),
    displayName: text(profile.display_name),
    role: apiUserRole(item.role_code),
    rankId: optionalText(item.rank_id),
    rankCode: optionalText(rank.code),
    password: "",
    mustChangePassword: Boolean(profile.must_change_password),
    status: item.status === "active" && profile.status !== "disabled" ? "active" : "disabled",
  };
}

function mapSessionUser(row: unknown): DemoUser {
  const item = asRecord(row);

  return {
    id: text(item.id),
    username: text(item.username),
    displayName: text(item.displayName),
    role: apiUserRole(item.role),
    rankCode: optionalText(item.rankCode),
    password: "",
    mustChangePassword: Boolean(item.mustChangePassword),
    status: item.status === "disabled" ? "disabled" : "active",
  };
}

function apiUserRole(value: unknown): UserRole {
  return requireKnownUserRole(text(value));
}

function mapApiCustomer(row: unknown): Customer {
  const item = asRecord(row);

  return {
    id: text(item.id),
    name: text(item.name),
    contactName: optionalText(item.contact_name) ?? "-",
    phone: optionalText(item.phone) ?? "",
    source: optionalText(item.source) ?? "系统录入",
  };
}

function mapApiTask(row: unknown, ranks: Rank[], portalTokens: PortalTokenMap): Task {
  const item = asRecord(row);
  const customer = relation(item.customers);
  const deliverables = relationList(item.task_deliverables);
  const latestDeliverable = deliverables.at(-1);
  const minRankId = optionalText(item.min_rank_id);
  const minRank = minRankId ? ranks.find((rank) => rank.id === minRankId) : undefined;
  const taskId = text(item.id);

  return {
    id: taskId,
    title: text(item.title),
    customerId: optionalText(item.customer_id) ?? optionalText(customer.id) ?? "",
    customerName: optionalText(customer.name),
    description: optionalText(item.description) ?? "",
    taskType: optionalText(item.task_type) ?? "诉讼任务",
    amountCents: number(item.amount_cents),
    minRankId,
    minRankCode: minRank?.code ?? minRankId ?? "-",
    sourceLawyerId: text(item.source_lawyer_id),
    assignedLawyerId: optionalText(item.assigned_lawyer_id),
    status: text(item.status) as TaskStatus,
    dueAt: optionalText(item.due_at) ?? "-",
    portalToken: portalTokens[taskId] ?? "",
    deliverables: deliverables.map((deliverable) => ({
      id: text(deliverable.id),
      title: optionalText(deliverable.title) ?? "交付成果",
      content: optionalText(deliverable.content) ?? "",
      downloadUrl: optionalText(deliverable.file_name)
        ? `/api/tasks/${taskId}/deliverables/${text(deliverable.id)}/download`
        : undefined,
      externalUrl: optionalText(deliverable.external_url),
      fileMimeType: optionalText(deliverable.file_mime_type),
      fileName: optionalText(deliverable.file_name),
      fileSizeBytes:
        deliverable.file_size_bytes === null || deliverable.file_size_bytes === undefined
          ? undefined
          : number(deliverable.file_size_bytes),
      submittedAt: optionalText(deliverable.submitted_at),
    })),
    submittedTitle: optionalText(latestDeliverable?.title),
    submittedContent: optionalText(latestDeliverable?.content),
    externalUrl: optionalText(latestDeliverable?.external_url),
    approvedAt: optionalText(item.approved_at),
    caseResultScore: optionalNumber(item.case_result_score),
    caseResultSummary: optionalText(item.case_result_summary),
    reviewComment: optionalText(item.review_comment),
    reviewedAt: optionalText(item.reviewed_at),
    reviewLawyerId: optionalText(item.review_lawyer_id),
    reviewRequired: Boolean(item.review_required),
    reviewStatus: optionalText(item.review_status) as Task["reviewStatus"],
    sourceReviewComment: optionalText(item.source_review_comment),
    sourceReviewScore: optionalNumber(item.source_review_score),
    sourceReviewedAt: optionalText(item.source_reviewed_at),
    customerConfirmedAt: optionalText(item.customer_confirmed_at),
  };
}

function mapApiSettlement(row: unknown, ranks: Rank[]): Settlement {
  const item = asRecord(row);
  const task = relation(item.tasks);
  const profile = relation(item.profiles);
  const rankId = optionalText(item.rank_id);
  const rank = rankId ? ranks.find((rankItem) => rankItem.id === rankId) : undefined;
  const riskFreeze = asRecord(item.risk_freeze);

  return {
    id: text(item.id),
    taskId: text(item.task_id),
    taskTitle: optionalText(task.title),
    lawyerId: text(item.lawyer_id),
    lawyerName: optionalText(profile.display_name),
    rankId,
    rankCode: rank?.code ?? rankId ?? "-",
    taskAmountCents: number(item.task_amount_cents),
    settlementBasisPoints: number(item.settlement_basis_points),
    settlementAmountCents: number(item.settlement_amount_cents),
    payableAmountCents: optionalNumber(item.payable_amount_cents),
    status: item.status === "confirmed" ? "confirmed" : "pending",
    riskFreezeCaseCount: number(riskFreeze.active_case_count),
    riskFreezeCaseTitles: textList(riskFreeze.risk_case_titles),
    riskFreezeHighestSeverity: optionalText(riskFreeze.highest_severity) as Settlement["riskFreezeHighestSeverity"],
    riskFreezeReason: optionalText(riskFreeze.summary),
    riskFrozen: Boolean(riskFreeze.frozen),
    riskDeductionBasisPoints: optionalNumber(riskFreeze.deduction_basis_points),
    lockedRiskDeductionBasisPoints: optionalNumber(item.risk_deduction_basis_points),
    riskDeductionAmountCents: optionalNumber(item.risk_deduction_amount_cents),
    riskDeductionCaseId: optionalText(item.risk_deduction_case_id),
    riskDeductionLockedAt: optionalText(item.risk_deduction_locked_at),
    riskDeductionNote: optionalText(item.risk_deduction_note),
    riskPenaltyDestination: optionalText(item.risk_penalty_destination) as Settlement["riskPenaltyDestination"],
    riskSuggestedDeductionCents: optionalNumber(riskFreeze.suggested_deduction_cents),
    riskSuggestedPayableCents: optionalNumber(riskFreeze.suggested_payable_cents),
    riskDeductionCandidateBasisPoints: optionalNumber(asRecord(riskFreeze.deduction_lock_candidate).basis_points),
    riskDeductionCandidateCaseId: optionalText(asRecord(riskFreeze.deduction_lock_candidate).risk_case_id),
    riskDeductionCandidateTitle: optionalText(asRecord(riskFreeze.deduction_lock_candidate).title),
    generatedAt: optionalText(item.generated_at),
    confirmedAt: optionalText(item.confirmed_at),
  };
}

function mapApiAuditLog(row: unknown): AuditLog {
  const item = asRecord(row);
  const actor = relation(item.actor);
  const entityType = optionalText(item.entity_type) ?? "system";
  const entityId = optionalText(item.entity_id);
  const createdAt = optionalText(item.created_at);

  return {
    id: text(item.id),
    actor: optionalText(actor.display_name) ?? optionalText(actor.username) ?? "系统",
    action: optionalText(item.action) ?? "系统事件",
    actionCode: optionalText(item.action),
    entity: entityId ? `${entityType}/${entityId.slice(0, 8)}` : entityType,
    entityType,
    createdAt: formatApiDateTime(createdAt),
    rawCreatedAt: createdAt,
  };
}

function mapApiFundTransaction(row: unknown): FundTransaction {
  const item = asRecord(row);
  const task = relation(item.task);
  const riskCase = relation(item.risk_case);
  const creator = relation(item.created_by_profile);

  return {
    id: text(item.id),
    accountType: text(item.account_type) as FundTransaction["accountType"],
    amountCents: number(item.amount_cents),
    createdAt: optionalText(item.created_at) ?? "",
    createdByName: optionalText(creator.display_name) ?? optionalText(creator.username),
    direction: (optionalText(item.direction) ?? "inflow") as FundTransaction["direction"],
    note: optionalText(item.note),
    riskCaseId: optionalText(item.risk_case_id),
    riskCaseTitle: optionalText(riskCase.title),
    settlementId: optionalText(item.settlement_id),
    status: (optionalText(item.status) ?? "posted") as FundTransaction["status"],
    taskId: optionalText(item.task_id),
    taskTitle: optionalText(task.title),
    transactionType: (optionalText(item.transaction_type) ?? "risk_deduction") as FundTransaction["transactionType"],
  };
}

function mapApiFundSummary(row: unknown): FundSummaryItem {
  const item = asRecord(row);

  return {
    accountType: text(item.accountType) as FundSummaryItem["accountType"],
    balanceCents: number(item.balanceCents),
    inflowCents: number(item.inflowCents),
    label: text(item.label),
    latestTransactionAt: optionalText(item.latestTransactionAt),
    outflowCents: number(item.outflowCents),
    postedCount: number(item.postedCount),
  };
}

function mapApiRiskCase(row: unknown): RiskCase {
  const item = asRecord(row);
  const task = relation(item.task);
  const customer = relation(item.customer);
  const reporter = relation(item.reporter);
  const owner = relation(item.owner);
  const committeeDecider = relation(item.committeeDecider);
  const createdAt = optionalText(item.created_at);
  const updatedAt = optionalText(item.updated_at);

  return {
    id: text(item.id),
    committeeDecidedAt: optionalText(item.committee_decided_at),
    committeeDecidedByUserId: optionalText(item.committee_decided_by),
    committeeDeciderName: optionalText(committeeDecider.display_name) ?? optionalText(committeeDecider.username),
    committeeDecision: optionalText(item.committee_decision) as RiskCase["committeeDecision"],
    committeeDecisionNote: optionalText(item.committee_decision_note),
    committeeDeductionBasisPoints: optionalNumber(item.committee_deduction_basis_points),
    createdAt: formatApiDateTime(createdAt),
    customerId: optionalText(item.customer_id),
    customerName: optionalText(customer.name),
    defendedAt: optionalText(item.defended_at),
    defenseStatement: optionalText(item.defense_statement),
    description: optionalText(item.description),
    ownerName: optionalText(owner.display_name) ?? optionalText(owner.username),
    ownerUserId: optionalText(item.owner_user_id),
    rawCreatedAt: createdAt,
    rawUpdatedAt: updatedAt,
    reportedByUserId: optionalText(item.reported_by_user_id),
    reporterName: optionalText(reporter.display_name) ?? optionalText(reporter.username),
    resolutionNote: optionalText(item.resolution_note),
    resolvedAt: optionalText(item.resolved_at),
    severity: text(item.severity) as RiskCase["severity"],
    source: text(item.source) as RiskCase["source"],
    status: text(item.status) as RiskCase["status"],
    taskId: optionalText(item.task_id),
    taskAssignedLawyerId: optionalText(task.assigned_lawyer_id),
    taskTitle: optionalText(task.title),
    title: text(item.title),
    updatedAt: formatApiDateTime(updatedAt),
  };
}

function mapApiPortal(row: unknown, token: string): ApiPortalSnapshot {
  const item = asRecord(row);
  const customer = relation(item.customers);
  const task = relation(item.tasks);
  const deliverables = relationList(task.task_deliverables);
  const latestDeliverable = deliverables.at(-1);
  const taskStatus = text(task.status) as TaskStatus;
  const canDownload = canCustomerDownloadDeliverable(taskStatus);
  const encodedToken = encodeURIComponent(token);

  return {
    taskId: text(task.id),
    title: text(task.title),
    description: optionalText(task.description) ?? "",
    status: taskStatus,
    customerName: optionalText(customer.name) ?? "客户",
    deliverables: deliverables.map((deliverable) => ({
      id: text(deliverable.id),
      title: optionalText(deliverable.title) ?? "交付成果",
      content: optionalText(deliverable.content) ?? "",
      downloadUrl:
        canDownload && optionalText(deliverable.file_name)
          ? `/api/customer-portal/${encodedToken}/deliverables/${text(deliverable.id)}/download`
          : undefined,
      externalUrl: optionalText(deliverable.external_url),
      fileMimeType: optionalText(deliverable.file_mime_type),
      fileName: optionalText(deliverable.file_name),
      fileSizeBytes:
        deliverable.file_size_bytes === null || deliverable.file_size_bytes === undefined
          ? undefined
          : number(deliverable.file_size_bytes),
      submittedAt: optionalText(deliverable.submitted_at),
    })),
    submittedTitle: optionalText(latestDeliverable?.title),
    submittedContent: optionalText(latestDeliverable?.content),
    externalUrl: optionalText(latestDeliverable?.external_url),
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function relation(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) {
    return asRecord(value[0]);
  }

  return asRecord(value);
}

function relationList(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(asRecord);
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function optionalText(value: unknown): string | undefined {
  const result = text(value).trim();

  return result || undefined;
}

function textList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(text).filter(Boolean);
}

function number(value: unknown): number {
  const result = Number(value);

  return Number.isFinite(result) ? result : 0;
}

function optionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const result = Number(value);

  return Number.isFinite(result) ? result : undefined;
}

function mapApiPagination(value: unknown, params: ApiListParams = {}): ApiPagination {
  const item = asRecord(value);
  const pageSize = positiveNumber(item.pageSize, params.pageSize ?? 50);
  const total = positiveNumber(item.total, 0);
  const page = positiveNumber(item.page, params.page ?? 1);
  const totalPages = Math.max(1, positiveNumber(item.totalPages, Math.ceil(total / pageSize)));

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: Boolean(item.hasNextPage ?? page < totalPages),
    hasPreviousPage: Boolean(item.hasPreviousPage ?? page > 1),
  };
}

function positiveNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function formatApiDateTime(value: unknown): string {
  const raw = text(value);

  if (!raw) {
    return "-";
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return date.toLocaleString("zh-CN", { hour12: false });
}
