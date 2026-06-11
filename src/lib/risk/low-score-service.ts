import type { SupabaseClient } from "@supabase/supabase-js";

import type { AuditLogInput } from "../audit/log.ts";
import { writeAuditLog } from "../audit/log.ts";
import { buildLowScoreRiskCaseDraft, shouldCreateLowScoreRiskCase } from "./cases.ts";

export type CreateLowScoreRiskCaseInput = {
  auditContext?: Pick<AuditLogInput, "ipAddress" | "userAgent">;
  comment?: string;
  customerId?: string | null;
  organizationId: string;
  reportedByUserId?: string;
  score: number | undefined;
  scoreLabel: string;
  taskId: string;
  taskTitle?: string | null;
};

export async function createLowScoreRiskCase(
  admin: SupabaseClient,
  input: CreateLowScoreRiskCaseInput,
): Promise<string | null> {
  if (!shouldCreateLowScoreRiskCase(input.score)) {
    return null;
  }

  const score = Number(input.score);
  const draft = buildLowScoreRiskCaseDraft({
    comment: input.comment,
    score,
    scoreLabel: input.scoreLabel,
    taskTitle: input.taskTitle ?? undefined,
  });
  const { data, error } = await admin
    .from("risk_cases")
    .insert({
      organization_id: input.organizationId,
      task_id: input.taskId,
      customer_id: input.customerId,
      reported_by_user_id: input.reportedByUserId,
      source: draft.source,
      severity: draft.severity,
      status: draft.status,
      title: draft.title,
      description: draft.description,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  await writeAuditLog(admin, {
    organizationId: input.organizationId,
    actorUserId: input.reportedByUserId,
    action: "risk_cases.auto_create",
    entityType: "risk_cases",
    entityId: data.id,
    metadata: {
      score,
      scoreLabel: input.scoreLabel,
      taskId: input.taskId,
    },
    ...input.auditContext,
  });

  return data.id;
}
