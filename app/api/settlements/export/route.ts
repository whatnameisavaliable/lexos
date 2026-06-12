import { NextResponse } from "next/server";

import { handleApiError } from "@/lib/api/http";
import { normalizedQueryParam, postgrestInFilter, postgrestLikePattern } from "@/lib/api/pagination";
import { requireInternalSession } from "@/lib/auth/session";
import { isLawyerRole, type UserRole } from "@/lib/domain/core";
import { settlementsToCsv } from "@/lib/settlements/export";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const settlementRoles: UserRole[] = ["director", "finance", "lawyer"];

export async function GET(request: Request) {
  try {
    const session = await requireInternalSession(settlementRoles);
    const admin = createSupabaseAdminClient();
    const status = normalizedQueryParam(request, "status");
    const searchPattern = postgrestLikePattern(
      normalizedQueryParam(request, "search") ?? normalizedQueryParam(request, "keyword"),
    );
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
        "id, task_id, lawyer_id, rank_id, task_amount_cents, settlement_basis_points, settlement_amount_cents, payable_amount_cents, risk_deduction_amount_cents, risk_penalty_destination, risk_deduction_locked_at, status, generated_at, confirmed_at, tasks:task_id!inner(title), profiles:lawyer_id!inner(display_name, username), ranks:rank_id!inner(code)",
      )
      .eq("organization_id", session.organizationId)
      .order("generated_at", { ascending: false })
      .limit(1000);

    if (isLawyerRole(session.roleCode)) {
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

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const csv = settlementsToCsv(
      (data ?? []).map((row) => {
        const record = row as Record<string, unknown>;
        const task = relation(record.tasks);
        const profile = relation(record.profiles);
        const rank = relation(record.ranks);

        return {
          confirmedAt: optionalText(record.confirmed_at),
          generatedAt: optionalText(record.generated_at),
          id: text(record.id),
          lawyerName: optionalText(profile.display_name),
          lawyerUsername: optionalText(profile.username),
          rankCode: optionalText(rank.code),
          payableAmountCents: numberValue(record.payable_amount_cents, numberValue(record.settlement_amount_cents)),
          riskDeductionAmountCents: numberValue(record.risk_deduction_amount_cents),
          riskDeductionLockedAt: optionalText(record.risk_deduction_locked_at),
          riskPenaltyDestination: optionalText(record.risk_penalty_destination),
          settlementAmountCents: numberValue(record.settlement_amount_cents),
          settlementBasisPoints: numberValue(record.settlement_basis_points),
          status: text(record.status),
          taskAmountCents: numberValue(record.task_amount_cents),
          taskTitle: optionalText(task.title),
        };
      }),
    );
    const filename = `lexos-settlements-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      headers: {
        "content-disposition": `attachment; filename="${filename}"`,
        "content-type": "text/csv; charset=utf-8",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function relation(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) {
    return relation(value[0]);
  }

  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }

  return {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function optionalText(value: unknown): string | undefined {
  const result = text(value).trim();

  return result || undefined;
}

function numberValue(value: unknown, fallback = 0): number {
  const result = Number(value);

  return Number.isFinite(result) ? result : fallback;
}
