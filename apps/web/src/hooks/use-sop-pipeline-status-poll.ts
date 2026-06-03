"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSopPipelineStatus } from "@/lib/lawyer-sops-api";
import type { SopPipelineStatusResponse } from "@/lib/lawyer-sops-api.types";
import { SOP_PIPELINE_POLL_INTERVAL_MS } from "@/lib/sop-pipeline-poll-interval-ms";
import { shouldForceSopPipelinePoll } from "@/lib/sop-pipeline-poll-utils";

export interface UseSopPipelineStatusPollOptions {
  readonly enabled?: boolean;
  readonly onStatus?: (status: SopPipelineStatusResponse) => void;
}

export interface UseSopPipelineStatusPollResult {
  readonly status: SopPipelineStatusResponse | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly refresh: () => Promise<void>;
}

/**
 * 启动流水线状态轮询（`setInterval`，卸载清理）。
 */
export function startSopPipelineStatusPollInterval(options: {
  readonly tick: () => void | Promise<void>;
  readonly intervalMs: number;
}): () => void {
  const id = setInterval(() => {
    void options.tick();
  }, options.intervalMs);
  return () => clearInterval(id);
}

/**
 * `GET /api/sops/pipelines/:id/status` 轮询；任一步 `artifactStatus=running` 时保持启用。
 */
export function useSopPipelineStatusPoll(
  pipelineId: string,
  options: UseSopPipelineStatusPollOptions = {},
): UseSopPipelineStatusPollResult {
  const enabled = options.enabled ?? true;
  const [status, setStatus] = useState<SopPipelineStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const onStatusRef = useRef(options.onStatus);

  useEffect(() => {
    onStatusRef.current = options.onStatus;
  }, [options.onStatus]);

  const refresh = useCallback(async () => {
    try {
      const next = await getSopPipelineStatus(pipelineId);
      setStatus(next);
      setError(null);
      onStatusRef.current?.(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [pipelineId]);

  const forcePoll =
    status !== null && shouldForceSopPipelinePoll(status.steps);
  const pollEnabled = enabled || forcePoll;

  useEffect(() => {
    if (!pollEnabled || !pipelineId) {
      return;
    }
    void refresh();
    const stop = startSopPipelineStatusPollInterval({
      tick: refresh,
      intervalMs: SOP_PIPELINE_POLL_INTERVAL_MS,
    });
    return stop;
  }, [pollEnabled, pipelineId, refresh]);

  return { status, loading, error, refresh };
}
