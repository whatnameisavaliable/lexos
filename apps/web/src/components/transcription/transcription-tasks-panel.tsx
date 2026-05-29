"use client";

import { useCallback, useEffect, useState } from "react";
import type { TranscriptionTaskSummary } from "@lexos/shared";
import { listTasks } from "@/lib/transcription-api";
import { toApiClientError } from "@/lib/api-client";
import { getTaskPollIntervalMs } from "@/lib/public-env";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NewTranscriptionDialog } from "./new-transcription-dialog";
import { TranscriptionTasksTable } from "./transcription-tasks-table";

const PAGE_LIMIT = "50";

const TERMINAL_STATUSES = new Set(["completed", "failed"]);

function hasActivePipelineTasks(items: readonly TranscriptionTaskSummary[]): boolean {
  return items.some((item) => !TERMINAL_STATUSES.has(item.status));
}

export interface TranscriptionTasksPanelProps {
  readonly title?: string;
}

/**
 * 转写任务列表面板（律师 / 管理员复用 · `ui_design.md` §6.3）。
 */
export function TranscriptionTasksPanel({
  title = "语音转写",
}: TranscriptionTasksPanelProps) {
  const [items, setItems] = useState<readonly TranscriptionTaskSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>();
  const [cursorStack, setCursorStack] = useState<readonly string[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  const load = useCallback(async (opts?: { cursor?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listTasks({
        limit: PAGE_LIMIT,
        cursor: opts?.cursor,
      });
      setItems(data.items);
      setNextCursor(data.meta.nextCursor);
    } catch (err) {
      setError(toApiClientError(err).message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load({ cursor });
  }, [load, cursor]);

  useEffect(() => {
    if (loading || error || !hasActivePipelineTasks(items)) {
      return;
    }
    const timer = setInterval(() => {
      void load({ cursor });
    }, getTaskPollIntervalMs());
    return () => {
      clearInterval(timer);
    };
  }, [loading, error, items, cursor, load]);

  function refresh() {
    void load({ cursor });
  }

  function goNextPage() {
    if (!nextCursor) {
      return;
    }
    setCursorStack((prev) => [...prev, cursor ?? ""]);
    setCursor(nextCursor);
  }

  function goPrevPage() {
    if (cursorStack.length === 0) {
      setCursor(undefined);
      return;
    }
    const stack = [...cursorStack];
    const prev = stack.pop();
    setCursorStack(stack);
    setCursor(prev || undefined);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{title}</h1>
        <NewTranscriptionDialog onCreated={() => refresh()} />
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
          <p>暂无转写任务</p>
          <NewTranscriptionDialog onCreated={() => refresh()} />
        </div>
      ) : (
        <TranscriptionTasksTable items={items} />
      )}

      {!loading && !error && items.length > 0 ? (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={cursorStack.length === 0 && !cursor}
            onClick={goPrevPage}
          >
            上一页
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!nextCursor}
            onClick={goNextPage}
          >
            下一页
          </Button>
        </div>
      ) : null}
    </div>
  );
}
