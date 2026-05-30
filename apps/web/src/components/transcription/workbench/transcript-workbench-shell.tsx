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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskStatusBadge } from "../task-status-badge";
import { formatDurationSec } from "../format-duration";
import {
  AudioPlayerPanel,
  type AudioPlayerHandle,
} from "./audio-player-panel";
import { DiarizationDegradedAlert } from "./diarization-degraded-alert";
import { ExportMenu } from "./export-menu";
import { PolishedTextEditor } from "./polished-text-editor";
import { PrintPreviewPanel } from "./print-preview-panel";
import { ProofreadTranscriptView } from "./proofread-transcript-view";
import { TranscriptModeSwitch, type TranscriptWorkbenchMode } from "./transcript-mode-switch";
import { TranscriptSaveToolbar } from "./transcript-save-toolbar";
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

/** 转写工作台 Grid 布局（`ui_design.md` §4.3.1）。 */
export function TranscriptWorkbenchShell({ taskId }: TranscriptWorkbenchShellProps) {
  const audioRef = useRef<AudioPlayerHandle>(null);
  const [task, setTask] = useState<TranscriptionTaskDetail | null>(null);
  const [transcript, setTranscript] = useState<TranscriptionTranscriptDetail | null>(
    null,
  );
  const [mode, setMode] = useState<TranscriptWorkbenchMode>("proofread");
  const [draftPolishedText, setDraftPolishedText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const transcriptData = await getTranscript(taskId);
      setTask(taskData);
      setTranscript(transcriptData);
      setDraftPolishedText(transcriptData.polishedText ?? "");
      setCachedTranscriptVersion(taskId, transcriptData.version);
      setMode(
        hasTimestampSegments(transcriptData.asrRawJson) ? "proofread" : "edit",
      );
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
          </AlertDescription>
        </Alert>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TaskStatusBadge status={task.status} />
          <span>{task.title}</span>
        </div>
      </div>
    );
  }

  const showTimestamps = hasTimestampSegments(transcript.asrRawJson);

  return (
    <div className="flex flex-col gap-4">
      <div className="transcript-workbench__toolbar no-print">
        <div className="flex flex-col gap-1">
          <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
            <Link href="/transcription">← 返回列表</Link>
          </Button>
          <h1 className="text-xl font-semibold">{task.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <TaskStatusBadge status={task.status} />
            <span>时长 {formatDurationSec(task.durationSec)}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TranscriptModeSwitch
            mode={mode}
            onModeChange={setMode}
            hasTimestamps={showTimestamps}
          />
          <ExportMenu taskId={taskId} />
          {mode === "edit" ? (
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

      {transcript.diarizationDegraded ? <DiarizationDegradedAlert /> : null}

      <div className="transcript-workbench">
        <Card className="transcript-workbench__panel">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">音频</CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
            <AudioPlayerPanel ref={audioRef} taskId={taskId} />
            <Separator />
            <PrintPreviewPanel
              title={task.title}
              polishedText={transcript.polishedText}
              summaryText={transcript.summaryText}
            />
          </CardContent>
        </Card>

        <Card className="transcript-workbench__panel">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {mode === "proofread" ? "校对视图" : "润色编辑"}
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full max-h-[calc(100dvh-var(--header-height)-12rem)] px-6 pb-6">
              {mode === "proofread" ? (
                <ProofreadTranscriptView
                  asrRawJson={transcript.asrRawJson}
                  onSeek={(ms) => audioRef.current?.seek(ms)}
                />
              ) : (
                <PolishedTextEditor
                  value={draftPolishedText}
                  onChange={setDraftPolishedText}
                />
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
