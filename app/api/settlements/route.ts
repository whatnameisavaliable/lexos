import { handleApiError, ok } from "@/lib/api/http";
import {
  normalizedQueryParam,
  paginationMeta,
  parseListQuery,
  parseListSort,
  postgrestInFilter,
  postgrestLikePattern,
} from "@/lib/api/pagination";
import { requireInternalSession } from "@/lib/auth/session";
import type { UserRole } from "@/lib/domain/core";
import { calculateRiskDeductionPreview, type RiskDeductionRates } from "@/lib/risk/deductions";
import { loadRiskDeductionRates } from "@/lib/risk/deductions-service";
import type { TaskRiskFreezeStatus } from "@/lib/risk/task-freeze";
import { loadTaskRiskFreezeMap } from "@/lib/risk/task-freeze-service";
import { loadSystemSettingNumber } from "@/lib/settings/runtime";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const settlementRoles: UserRole[] = ["system_admin", "firm_admin", "finance", "handling_lawyer"];
const settlementSortOptions = {
  amountDesc: { ascending: false, column: "payable_amount_cents" },
  generatedAtAsc: { ascending: true, column: "generated_at" },
  generatedAtDesc: { ascending: false, column: "generated_at" },
  statusAsc: { ascending: true, column: "status" },
};

export async function GET(request: Request) {
  try {
    const session = await requireInternalSession(settlementRoles);
    const admin = createSupabaseAdminClient();
    const [defaultPageSize, riskDeductionRates] = await Promise.all([
      loadSystemSettingNumber(admin, session.organizationId, "default_page_size"),
      loadRiskDeductionRates(admin, session.organizationId),
    ]);
    const listQuery = parseListQuery(request, { defaultPageSize });
    const sort = parseListSort(request, settlementSortOptions, "generatedAtDesc");
    const status = normalizedQueryParam(request, "status");
    const searchPattern = postgrestLikePattern(listQuery.search);
    let matchedLawyerIds: string[] = [];
    let matchedTaskIds: string[] = [];

    if (searchPattern) {
      const [{ data: tasks, error: taskSearchError }, { data: profiles, error: profileSearchError }] = await Promise.all([
        admin
          .from("tasks")
          .select("id")
          .eq("organization_id", session.organizationId)
          .or([`title.ilike.${searchPattern}`, `description.ilike.${searchPattern}`].join(","))
          .limit(200),
        admin
          .from("profiles")
          .select("id")
          .or([`display_name.ilike.${searchPattern}`, `username.ilike.${searchPattern}`].join(","))
          .limit(200),
      ]);

      if (taskSearchError) {
        throw taskSearchError;
      }

      if (profileSearchError) {
        throw profileSearchError;
      }

      matchedTaskIds = (tasks ?? []).map((task) => task.id);
      matchedLawyerIds = (profiles ?? []).map((profile) => profile.id);
    }

    let query = admin
      .from("settlements")
      .select(
        "id, task_id, lawyer_id, rank_id, task_amount_cents, settlement_basis_points, settlement_amount_cents, payable_amount_cents, risk_deduction_case_id, risk_deduction_basis_points, risk_deduction_amount_cents, risk_penalty_destination, risk_deduction_note, risk_deduction_locked_at, status, generated_at, confirmed_at, tasks:task_id!inner(title), profiles:lawyer_id!inner(display_name)",
        { count: "exact" },
      )
      .eq("organization_id", session.organizationId)
      .order(sort.column, { ascending: sort.ascending });

    if (session.roleCode === "handling_lawyer") {
      query = query.eq("lawyer_id", session.userId);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (searchPattern) {
      const filters = [`status.ilike.${searchPattern}`];
      const taskFilter = postgrestInFilter(matchedTaskIds);
      const lawyerFilter = postgrestInFilter(matchedLawyerIds);

      if (taskFilter) {
        filters.push(`task_id.in.${taskFilter}`);
      }

      if (lawyerFilter) {
        filters.push(`lawyer_id.in.${lawyerFilter}`);
      }

      query = query.or(filters.join(","));
    }

    const { data, error, count } = await query.range(listQuery.from, listQuery.to);

    if (error) {
      throw error;
    }

    const settlements = data ?? [];
    const taskIds = Array.from(new Set(settlements.map((settlement) => settlement.task_id).filter(Boolean)));
    const riskFreezeByTaskId = await loadTaskRiskFreezeMap(admin, session.organizationId, taskIds);
    const enrichedSettlements = settlements.map((settlement) => ({
      ...settlement,
      risk_freeze: riskFreezePayload(
        riskFreezeByTaskId.get(settlement.task_id),
        Number(settlement.settlement_amount_cents),
        riskDeductionRates,
      ),
    }));

    return ok({ pagination: paginationMeta(listQuery, count), settlements: enrichedSettlements });
  } catch (error) {
    return handleApiError(error);
  }
}

function riskFreezePayload(status?: TaskRiskFreezeStatus, settlementAmountCents = 0, riskDeductionRates?: RiskDeductionRates) {
  const deductionPreview = calculateRiskDeductionPreview(settlementAmountCents, status?.highestSeverity, riskDeductionRates);

  return {
    active_case_count: status?.activeRiskCaseCount ?? 0,
    deduction_basis_points: deductionPreview?.basisPoints ?? null,
    frozen: Boolean(status?.frozen),
    highest_severity: status?.highestSeverity ?? null,
    risk_case_ids: status?.riskCaseIds ?? [],
    risk_case_titles: status?.riskCaseTitles ?? [],
    deduction_lock_candidate: status?.deductionLockCandidate
      ? {
          basis_points: status.deductionLockCandidate.basisPoints,
          risk_case_id: status.deductionLockCandidate.riskCaseId,
          title: status.deductionLockCandidate.title,
        }
      : null,
    suggested_deduction_cents: deductionPreview?.deductionAmountCents ?? null,
    suggested_payable_cents: deductionPreview?.payableAmountCents ?? null,
    summary: status?.summary ?? null,
  };
}
