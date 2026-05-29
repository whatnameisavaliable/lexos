"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getTask,
  type TranscriptionTaskDetail,
} from "@/lib/transcription-api";
import { getTaskPollIntervalMs } from "@/lib/public-env";

export interface UseTaskPollingOptions {
  readonly taskId: string | null;
  /** 轮询间隔（毫秒）；默认读取 `NEXT_PUBLIC_TASK_POLL_INTERVAL_MS`，最小 2000。 */
  readonly intervalMs?: number;
  readonly enabled?: boolean;
  /** 返回 `true` 时停止轮询（如任务进入终态）。 */
  readonly stopWhen?: (task: TranscriptionTaskDetail) => boolean;
}

export interface UseTaskPollingResult {
  readonly task: TranscriptionTaskDetail | null;
  readonly loading: boolean;
  readonly error: Error | null;
  /** 立即拉取一次。 */
  refresh: () => Promise<void>;
}

/**
 * 转写任务状态轮询（`ui_design.md` §6.3.5，间隔 ≥ 2s）。
 */
export function useTaskPolling(
  options: UseTaskPollingOptions,
): UseTaskPollingResult {
  const {
    taskId,
    intervalMs = getTaskPollIntervalMs(),
    enabled = true,
    stopWhen,
  } = options;

  const [task, setTask] = useState<TranscriptionTaskDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const stoppedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!taskId) {
      setTask(null);
      return;
    }
    setLoading(true);
    try {
      const data = await getTask(taskId);
      setTask(data);
      setError(null);
      if (stopWhen?.(data)) {
        stoppedRef.current = true;
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [taskId, stopWhen]);

  useEffect(() => {
    stoppedRef.current = false;
  }, [taskId]);

  useEffect(() => {
    if (!enabled || !taskId) {
      return;
    }
    stoppedRef.current = false;
    void refresh();

    const timer = setInterval(() => {
      if (!stoppedRef.current) {
        void refresh();
      }
    }, intervalMs);

    return () => {
      clearInterval(timer);
    };
  }, [enabled, taskId, intervalMs, refresh]);

  return { task, loading, error, refresh };
}
