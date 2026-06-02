"use client";

import { useState } from "react";
import {
  retryTranscriptionTask,
  type TranscriptionTaskRetryScope,
} from "@/lib/transcription-api";
import { toApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface TaskRetryActionsProps {
  readonly taskId: string;
  readonly status: string;
  readonly llmPolishFailed?: boolean;
  readonly llmSummaryFailed?: boolean;
  readonly onRetried?: () => void;
}

/** 流水线 / LLM 分项重试（PRD-3.5-06 / §3.5.08）。 */
export function TaskRetryActions({
  taskId,
  status,
  llmPolishFailed = false,
  llmSummaryFailed = false,
  onRetried,
}: TaskRetryActionsProps) {
  const [loading, setLoading] = useState<TranscriptionTaskRetryScope | null>(null);

  async function run(scope: TranscriptionTaskRetryScope) {
    setLoading(scope);
    try {
      await retryTranscriptionTask(taskId, scope);
      toast.success(
        scope === "pipeline"
          ? "已提交重试，请稍候刷新状态"
          : "已提交重试，完成后请刷新页面",
      );
      onRetried?.();
    } catch (err) {
      toast.error(toApiClientError(err).message);
    } finally {
      setLoading(null);
    }
  }

  if (status === "failed") {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={loading !== null}
        onClick={() => void run("pipeline")}
      >
        {loading === "pipeline" ? "提交中…" : "重试后续步骤"}
      </Button>
    );
  }

  if (status !== "completed") {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {llmPolishFailed ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading !== null}
          onClick={() => void run("polish")}
        >
          {loading === "polish" ? "提交中…" : "重试润色"}
        </Button>
      ) : null}
      {llmSummaryFailed ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading !== null}
          onClick={() => void run("summary")}
        >
          {loading === "summary" ? "提交中…" : "重试摘要"}
        </Button>
      ) : null}
    </div>
  );
}
