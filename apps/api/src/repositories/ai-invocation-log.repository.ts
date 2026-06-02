import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AiFeatureKey, AiInvocationLogsQuery, SopAiInvocationMetadata } from "@lexos/shared";
import type { SupabaseEnvConfig } from "@lexos/shared/config";

/** 写入 `ai_invocation_logs` 入参。 */
export interface InsertAiInvocationLogInput {
  readonly taskId: string | null;
  readonly featureKey: AiFeatureKey;
  readonly modelId: string;
  readonly isFallback: boolean;
  readonly inputTokens?: number | null;
  readonly outputTokens?: number | null;
  readonly latencyMs: number;
  readonly outcome: "success" | "failure";
  readonly errorCode?: string | null;
  readonly metadata?: SopAiInvocationMetadata;
}

/** `ai_invocation_logs` 行。 */
export interface AiInvocationLogRowDb {
  readonly id: string;
  readonly task_id: string | null;
  readonly feature_key: string;
  readonly model_id: string;
  readonly is_fallback: boolean;
  readonly input_tokens: number | null;
  readonly output_tokens: number | null;
  readonly latency_ms: number;
  readonly outcome: string;
  readonly error_code: string | null;
  readonly created_at: string;
}

export interface AiInvocationLogListResult {
  readonly items: readonly AiInvocationLogRowDb[];
  readonly nextCursor?: string;
}

function encodeCursor(createdAt: string, id: string): string {
  return Buffer.from(`${createdAt}|${id}`, "utf8").toString("base64url");
}

function decodeCursor(cursor: string): { createdAt: string; id: string } {
  const decoded = Buffer.from(cursor, "base64url").toString("utf8");
  const sep = decoded.indexOf("|");
  if (sep < 0) throw new Error("Invalid invocation log cursor");
  return { createdAt: decoded.slice(0, sep), id: decoded.slice(sep + 1) };
}

/**
 * AI 调用日志只读仓库（admin；`service_role`）。
 */
export class AiInvocationLogRepository {
  constructor(private readonly serviceClient: SupabaseClient) {}

  static fromSupabaseEnv(
    supabaseEnv: SupabaseEnvConfig,
  ): AiInvocationLogRepository {
    const client = createClient(
      supabaseEnv.supabaseUrl,
      supabaseEnv.supabaseServiceRoleKey,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    return new AiInvocationLogRepository(client);
  }

  /** 插入调用日志（SOP 时 `taskId` 为 `null` 且 `metadata` 必填）。 */
  async insertInvocationLog(input: InsertAiInvocationLogInput): Promise<void> {
    const { error } = await this.serviceClient.from("ai_invocation_logs").insert({
      task_id: input.taskId,
      feature_key: input.featureKey,
      model_id: input.modelId,
      is_fallback: input.isFallback,
      input_tokens: input.inputTokens ?? null,
      output_tokens: input.outputTokens ?? null,
      latency_ms: input.latencyMs,
      outcome: input.outcome,
      error_code: input.errorCode ?? null,
      metadata: input.metadata ?? {},
    });
    if (error) {
      throw new Error(`ai_invocation_logs.insert failed: ${error.message}`);
    }
  }

  async listAdmin(query: AiInvocationLogsQuery): Promise<AiInvocationLogListResult> {
    const fetchLimit = query.limit + 1;
    let builder = this.serviceClient
      .from("ai_invocation_logs")
      .select(
        "id, task_id, feature_key, model_id, is_fallback, input_tokens, output_tokens, latency_ms, outcome, error_code, created_at",
      )
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (query.taskId) builder = builder.eq("task_id", query.taskId);
    if (query.featureKey) builder = builder.eq("feature_key", query.featureKey);
    if (query.outcome) builder = builder.eq("outcome", query.outcome);
    if (query.cursor) {
      const { createdAt, id } = decodeCursor(query.cursor);
      builder = builder.or(
        `created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`,
      );
    }

    const { data, error } = await builder.limit(fetchLimit);
    if (error) {
      throw new Error(`ai_invocation_logs.listAdmin failed: ${error.message}`);
    }

    const rows = (data ?? []) as AiInvocationLogRowDb[];
    const hasMore = rows.length > query.limit;
    const pageRows = hasMore ? rows.slice(0, query.limit) : rows;
    let nextCursor: string | undefined;
    if (hasMore && pageRows.length > 0) {
      const last = pageRows[pageRows.length - 1]!;
      nextCursor = encodeCursor(last.created_at, last.id);
    }
    return { items: pageRows, nextCursor };
  }
}
