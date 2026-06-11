import type { SupabaseClient } from "@supabase/supabase-js";

import { buildTaskRiskFreezeMap, type TaskRiskFreezeCase, type TaskRiskFreezeStatus } from "./task-freeze.ts";

export async function loadTaskRiskFreezeMap(
  admin: SupabaseClient,
  organizationId: string,
  taskIds: string[],
): Promise<Map<string, TaskRiskFreezeStatus>> {
  if (!taskIds.length) {
    return new Map();
  }

  const { data, error } = await admin
    .from("risk_cases")
    .select("id, task_id, title, severity, status, committee_decision, committee_deduction_basis_points")
    .eq("organization_id", organizationId)
    .in("task_id", taskIds)
    .neq("status", "resolved");

  if (error) {
    throw error;
  }

  const riskCases = (data ?? []).map((riskCase) => ({
    id: riskCase.id,
    committeeDeductionBasisPoints: riskCase.committee_deduction_basis_points,
    committeeDecision: riskCase.committee_decision,
    severity: riskCase.severity,
    status: riskCase.status,
    taskId: riskCase.task_id,
    title: riskCase.title,
  })) as TaskRiskFreezeCase[];

  return buildTaskRiskFreezeMap(taskIds, riskCases);
}
