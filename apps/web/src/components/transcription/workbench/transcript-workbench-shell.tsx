"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  TranscriptionTaskDetail,
  TranscriptionTranscriptDetail,
} from "@/lib/transcription-api";
import { getTask, getTranscript } from "@/lib/transcription-api";
import { setCachedTranscriptVersion } from "@/lib/transcript-if-match";
import { toApiClientError } from "@/lib/api-client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskStatusBadge } from "../task-status-badge";
import { formatDurationSec } from "../format-duration";
import {
  AudioPlayerPanel,
  type AudioPlayerControls,
} from "./audio-player-panel";
import { DiarizationDegradedAlert } from "./diarization-degraded-alert";
import { ExportMenu } from "./export-menu";
import { PolishedTextEditor } from "./polished-text-editor";
import { ProofreadTranscriptView } from "./proofread-transcript-view";
import { SummaryTranscriptView } from "./summary-transcript-view";
import { TaskRetryActions } from "../task-retry-actions";
import { TranscriptSaveToolbar } from "./transcript-save-toolbar";
import {
  WorkbenchViewTabs,
  type WorkbenchView,
} from "./workbench-view-tabs";
import "@/styles/transcript-workbench.css";

export interface TranscriptWorkbenchShellProps {
  readonly taskId: string;
}

function hasTimestampSegments(asrRawJson: unknown | null): boolean {
  if (!asrRawJson || typeof asrRawJson !== "object") {
    return false;
  }
  const segments = (asrRawJson as { segments?: unknown }).segments;
  return Array.isArray(segments) && segments.length > 0;
}

function resolveInitialView(
  transcript: TranscriptionTranscriptDetail,
): WorkbenchView {
  if (hasTimestampSegments(transcript.asrRawJson)) {
    return "proofread";
  }
  if (transcript.polishedText?.trim()) {
    return "edit";
  }
  if (transcript.summaryText?.trim()) {
    return "summary";
  }
  return "edit";
}

function viewTitle(view: WorkbenchView): string {
  switch (view) {
    case "proofread":
      return "校对（ASR 源稿）";
    case "edit":
      return "润色编辑（AI 整理稿）";
    case "summary":
      return "法律摘要";
  }
}

/** 转写工作台 Grid 布局（`ui_design.md` §4.3.1：左音频 · 右文稿）。 */
export function TranscriptWorkbenchShell({ taskId }: TranscriptWorkbenchShellProps) {
  const audioControlsRef = useRef<AudioPlayerControls | null>(null);
  const [task, setTask] = useState<TranscriptionTaskDetail | null>(null);
  const [transcript, setTranscript] = useState<TranscriptionTranscriptDetail | null>(
    null,
  );
  const [view, setView] = useState<WorkbenchView>("proofread");
  const [draftPolishedText, setDraftPolishedText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePlaybackMs, setActivePlaybackMs] = useState(0);

  const handleAudioControlsReady = useCallback(
    (controls: AudioPlayerControls | null) => {
      audioControlsRef.current = controls;
    },
    [],
  );

  const handleSeek = useCallback((ms: number) => {
    audioControlsRef.current?.seek(ms);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const taskData = await getTask(taskId);
      if (taskData.status !== "completed") {
        setTask(taskData);
        setTranscript(null);
        return;
      }
      let transcriptData: TranscriptionTranscriptDetail;
      try {
        transcriptData = await getTranscript(taskId);
      } catch {
        setTask(taskData);
        setTranscript(null);
        return;
      }
      setTask(taskData);
      setTranscript(transcriptData);
      setDraftPolishedText(transcriptData.polishedText ?? "");
      setCachedTranscriptVersion(taskId, transcriptData.version);
      setView(resolveInitialView(transcriptData));
    } catch (err) {
      setError(toApiClientError(err).message);
      setTask(null);
      setTranscript(null);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[480px] w-full" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex flex-col gap-4">
        <Button variant="outline" size="sm" className="w-fit" asChild>
          <Link href="/transcription">返回列表</Link>
        </Button>
        <Alert variant="destructive">
          <AlertDescription>{error ?? "无法加载转写工作台"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (task.status !== "completed" || !transcript) {
    return (
      <div className="flex flex-col gap-4">
        <Button variant="outline" size="sm" className="w-fit" asChild>
          <Link href="/transcription">返回列表</Link>
        </Button>
        <Alert>
          <AlertDescription>
            任务尚未完成（当前状态：{task.status}），完成后才可进入工作台。
            {task.errorMessage ? ` ${task.errorMessage}` : ""}
          </AlertDescription>
        </Alert>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <TaskStatusBadge status={task.status} />
          <span>{task.title}</span>
          <TaskRetryActions
            taskId={taskId}
            status={task.status}
            llmPolishFailed={task.llmPolishFailed}
            llmSummaryFailed={task.llmSummaryFailed}
            onRetried={() => void load()}
          />
        </div>
      </div>
    );
  }

  const showTimestamps = hasTimestampSegments(transcript.asrRawJson);
  const hasSummary = Boolean(transcript.summaryText?.trim());

  return (
    <div className="flex flex-col gap-4">
      <div className="transcript-workbench__toolbar no-print">
        <div className="flex flex-col gap-1">
          <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
            <Link href="/transcription">← 返回列表</Link>
          </Button>
          <h1 className="text-xl font-semibold">{task.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <TaskStatusBadge
              status={task.status}
              partialSuccess={
                task.llmPolishFailed === true || task.llmSummaryFailed === true
              }
            />
            <span>时长 {formatDurationSec(task.durationSec)}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportMenu taskId={taskId} />
          {view === "edit" ? (
            <TranscriptSaveToolbar
              taskId={taskId}
              polishedText={draftPolishedText}
              onSaved={(version) => {
                setTranscript((prev) =>
                  prev ? { ...prev, version, polishedText: draftPolishedText } : prev,
                );
                setCachedTranscriptVersion(taskId, version);
              }}
            />
          ) : null}
        </div>
      </div>

      {task.llmPolishFailed || task.llmSummaryFailed ? (
        <Alert>
          <AlertDescription className="flex flex-col gap-2">
            <span>
              部分步骤未成功：已保留 ASR 听写稿。
              {task.llmPolishFailed ? " 润色失败。" : ""}
              {task.llmSummaryFailed ? " 法律摘要失败。" : ""}
            </span>
            <TaskRetryActions
              taskId={taskId}
              status={task.status}
              llmPolishFailed={task.llmPolishFailed}
              llmSummaryFailed={task.llmSummaryFailed}
              onRetried={() => void load()}
            />
          </AlertDescription>
        </Alert>
      ) : null}

      {transcript.diarizationDegraded ? <DiarizationDegradedAlert /> : null}

      <div className="transcript-workbench">
        <Card className="transcript-workbench__panel">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">音频</CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col">
            <AudioPlayerPanel
              taskId={taskId}
              onControlsReady={handleAudioControlsReady}
              onTimeUpdate={setActivePlaybackMs}
            />
          </CardContent>
        </Card>

        <Card className="transcript-workbench__panel">
          <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">{viewTitle(view)}</CardTitle>
            <WorkbenchViewTabs
              view={view}
              onViewChange={setView}
              hasTimestamps={showTimestamps}
              hasSummary={hasSummary}
            />
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full max-h-[calc(100dvh-var(--header-height)-12rem)] px-6 pb-6">
              {view === "proofread" ? (
                <ProofreadTranscriptView
                  asrRawJson={transcript.asrRawJson}
                  onSeek={handleSeek}
                  activePlaybackMs={activePlaybackMs}
                />
              ) : null}
              {view === "edit" ? (
                <PolishedTextEditor
                  value={draftPolishedText}
                  onChange={setDraftPolishedText}
                />
              ) : null}
              {view === "summary" ? (
                <SummaryTranscriptView summaryText={transcript.summaryText} />
              ) : null}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
