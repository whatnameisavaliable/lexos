import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type RiskCaseRow = {
  committee_decided_at: string | null;
  committee_decided_by: string | null;
  committee_decision: string | null;
  committee_decision_note: string | null;
  committee_deduction_basis_points: number | null;
  created_at: string | null;
  customer_id: string | null;
  defended_at: string | null;
  defense_statement: string | null;
  description: string | null;
  id: string;
  organization_id: string;
  owner_user_id: string | null;
  reported_by_user_id: string | null;
  resolution_note: string | null;
  resolved_at: string | null;
  severity: string;
  source: string;
  status: string;
  task_id: string | null;
  title: string;
  updated_at: string | null;
};

export async function enrichRiskCases(admin: ReturnType<typeof createSupabaseAdminClient>, rows: RiskCaseRow[]) {
  const taskIds = unique(rows.map((row) => row.task_id));
  const customerIds = unique(rows.map((row) => row.customer_id));
  const profileIds = unique(rows.flatMap((row) => [row.reported_by_user_id, row.owner_user_id, row.committee_decided_by]));
  const tasksById = new Map<string, { assigned_lawyer_id: string | null; id: string; title: string | null }>();
  const customersById = new Map<string, { id: string; name: string | null }>();
  const profilesById = new Map<string, { display_name: string | null; id: string; username: string | null }>();

  if (taskIds.length) {
    const { data: tasks, error } = await admin.from("tasks").select("id, title, assigned_lawyer_id").in("id", taskIds);

    if (error) {
      throw error;
    }

    for (const task of tasks ?? []) {
      tasksById.set(task.id, task);
    }
  }

  if (customerIds.length) {
    const { data: customers, error } = await admin.from("customers").select("id, name").in("id", customerIds);

    if (error) {
      throw error;
    }

    for (const customer of customers ?? []) {
      customersById.set(customer.id, customer);
    }
  }

  if (profileIds.length) {
    const { data: profiles, error } = await admin.from("profiles").select("id, username, display_name").in("id", profileIds);

    if (error) {
      throw error;
    }

    for (const profile of profiles ?? []) {
      profilesById.set(profile.id, profile);
    }
  }

  return rows.map((row) => {
    const reporter = row.reported_by_user_id ? profilesById.get(row.reported_by_user_id) : undefined;
    const owner = row.owner_user_id ? profilesById.get(row.owner_user_id) : undefined;
    const committeeDecider = row.committee_decided_by ? profilesById.get(row.committee_decided_by) : undefined;

    return {
      ...row,
      committeeDecider: committeeDecider ?? null,
      customer: row.customer_id ? customersById.get(row.customer_id) ?? null : null,
      owner: owner ?? null,
      reporter: reporter ?? null,
      task: row.task_id ? tasksById.get(row.task_id) ?? null : null,
    };
  });
}

function unique(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}
