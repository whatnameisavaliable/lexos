import { ApiError, handleApiError, ok } from "@/lib/api/http";
import {
  normalizedQueryParam,
  paginationMeta,
  parseListQuery,
  parseListSort,
  postgrestLikePattern,
} from "@/lib/api/pagination";
import { requireInternalSession } from "@/lib/auth/session";
import type { UserRole } from "@/lib/domain/core";
import {
  buildFundSummary,
  type FundAccountType,
  type FundTransaction,
  type FundTransactionDirection,
  type FundTransactionStatus,
  type FundTransactionType,
} from "@/lib/funds/ledger";
import { settlementRiskPenaltyDestinations } from "@/lib/settlements/risk-deduction";
import { loadSystemSettingNumber } from "@/lib/settings/runtime";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const fundRoles: UserRole[] = ["director", "finance"];
const fundAccountTypes = new Set<string>(settlementRiskPenaltyDestinations);
const fundSortOptions = {
  accountTypeAsc: { ascending: true, column: "account_type" },
  amountDesc: { ascending: false, column: "amount_cents" },
  createdAtAsc: { ascending: true, column: "created_at" },
  createdAtDesc: { ascending: false, column: "created_at" },
};
const fundTransactionSelect =
  "id, account_type, settlement_id, risk_case_id, task_id, amount_cents, direction, transaction_type, status, note, created_by, created_at";

type FundTransactionRow = {
  id: string;
  account_type: string;
  amount_cents: number;
  created_at: string;
  created_by: string | null;
  direction: string;
  note: string | null;
  risk_case_id: string | null;
  settlement_id: string | null;
  status: string;
  task_id: string | null;
  transaction_type: string;
};

export async function GET(request: Request) {
  try {
    const session = await requireInternalSession(fundRoles);
    const admin = createSupabaseAdminClient();
    const defaultPageSize = await loadSystemSettingNumber(admin, session.organizationId, "default_page_size");
    const listQuery = parseListQuery(request, { defaultPageSize });
    const sort = parseListSort(request, fundSortOptions, "createdAtDesc");
    const accountType = normalizeAccountType(normalizedQueryParam(request, "accountType"));
    const searchPattern = postgrestLikePattern(listQuery.search);

    let query = admin
      .from("fund_transactions")
      .select(fundTransactionSelect, { count: "exact" })
      .eq("organization_id", session.organizationId)
      .order(sort.column, { ascending: sort.ascending });

    if (accountType && accountType !== "all") {
      query = query.eq("account_type", accountType);
    }

    if (searchPattern) {
      query = query.or(
        [
          `account_type.ilike.${searchPattern}`,
          `transaction_type.ilike.${searchPattern}`,
          `status.ilike.${searchPattern}`,
          `note.ilike.${searchPattern}`,
        ].join(","),
      );
    }

    const [{ data, error, count }, summaryRows] = await Promise.all([
      query.range(listQuery.from, listQuery.to),
      loadSummaryRows(admin, session.organizationId),
    ]);

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as FundTransactionRow[];
    const enrichment = await loadFundTransactionEnrichment(admin, rows);
    const transactions = rows.map((row) => enrichFundTransactionRow(row, enrichment));
    const summary = buildFundSummary(summaryRows.map(mapFundTransactionRow));

    return ok({ pagination: paginationMeta(listQuery, count), summary, transactions });
  } catch (error) {
    return handleApiError(error);
  }
}

function normalizeAccountType(value?: string): FundAccountType | "all" | undefined {
  if (!value || value === "all") {
    return value as "all" | undefined;
  }

  if (!fundAccountTypes.has(value)) {
    throw new ApiError(400, "BAD_REQUEST", "未知资金账户类型");
  }

  return value as FundAccountType;
}

async function loadSummaryRows(admin: ReturnType<typeof createSupabaseAdminClient>, organizationId: string) {
  const { data, error } = await admin
    .from("fund_transactions")
    .select(fundTransactionSelect)
    .eq("organization_id", organizationId)
    .limit(2000);

  if (error) {
    throw error;
  }

  return (data ?? []) as FundTransactionRow[];
}

async function loadFundTransactionEnrichment(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  rows: FundTransactionRow[],
) {
  const taskIds = uniqueText(rows.map((row) => row.task_id));
  const riskCaseIds = uniqueText(rows.map((row) => row.risk_case_id));
  const userIds = uniqueText(rows.map((row) => row.created_by));
  const [tasks, riskCases, profiles] = await Promise.all([
    taskIds.length
      ? admin.from("tasks").select("id, title").in("id", taskIds)
      : Promise.resolve({ data: [], error: null }),
    riskCaseIds.length
      ? admin.from("risk_cases").select("id, title").in("id", riskCaseIds)
      : Promise.resolve({ data: [], error: null }),
    userIds.length
      ? admin.from("profiles").select("id, username, display_name").in("id", userIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (tasks.error) {
    throw tasks.error;
  }

  if (riskCases.error) {
    throw riskCases.error;
  }

  if (profiles.error) {
    throw profiles.error;
  }

  return {
    profilesById: new Map((profiles.data ?? []).map((profile) => [profile.id, profile])),
    riskCasesById: new Map((riskCases.data ?? []).map((riskCase) => [riskCase.id, riskCase])),
    tasksById: new Map((tasks.data ?? []).map((task) => [task.id, task])),
  };
}

function enrichFundTransactionRow(
  row: FundTransactionRow,
  enrichment: Awaited<ReturnType<typeof loadFundTransactionEnrichment>>,
) {
  const task = row.task_id ? enrichment.tasksById.get(row.task_id) ?? null : null;
  const riskCase = row.risk_case_id ? enrichment.riskCasesById.get(row.risk_case_id) ?? null : null;
  const profile = row.created_by ? enrichment.profilesById.get(row.created_by) ?? null : null;

  return {
    ...row,
    created_by_profile: profile,
    risk_case: riskCase,
    task,
  };
}

function mapFundTransactionRow(row: FundTransactionRow): FundTransaction {
  return {
    id: row.id,
    accountType: row.account_type as FundAccountType,
    amountCents: Number(row.amount_cents),
    createdAt: row.created_at,
    direction: row.direction as FundTransactionDirection,
    note: row.note ?? undefined,
    riskCaseId: row.risk_case_id ?? undefined,
    settlementId: row.settlement_id ?? undefined,
    status: row.status as FundTransactionStatus,
    taskId: row.task_id ?? undefined,
    transactionType: row.transaction_type as FundTransactionType,
  };
}

function uniqueText(values: Array<string | null>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}
