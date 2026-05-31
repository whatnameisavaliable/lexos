"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { TranscriptionTaskDetail, TranscriptionTranscriptDetail } from "@/lib/transcription-api";
import { getTask, getTranscript } from "@/lib/transcription-api";
import { toApiClientError } from "@/lib/api-client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskStatusBadge } from "./task-status-badge";
import { formatDurationSec } from "./format-duration";

export interface TranscriptViewPanelProps {
  readonly taskId: string;
}

function extractAsrPlainText(asrRawJson: unknown): string | null {
  if (!asrRawJson || typeof asrRawJson !== "object") {
    return null;
  }
  const record = asrRawJson as Record<string, unknown>;
  if (typeof record.text === "string" && record.text.trim()) {
    return record.text.trim();
  }
  const segments = record.segments;
  if (Array.isArray(segments)) {
    const parts = segments
      .map((segment) => {
        if (!segment || typeof segment !== "object") {
          return "";
        }
        const text = (segment as Record<string, unknown>).text;
        return typeof text === "string" ? text.trim() : "";
      })
      .filter(Boolean);
    if (parts.length > 0) {
      return parts.join("\n");
    }
  }
  return null;
}

function TranscriptBody({
  text,
  emptyLabel,
}: {
  readonly text: string | null;
  readonly emptyLabel: string;
}) {
  if (!text?.trim()) {
    return (
      <p className="text-sm text-muted-foreground">{emptyLabel}</p>
    );
  }
  return (
    <div className="whitespace-pre-wrap text-sm leading-7 text-foreground">
      {text}
    </div>
  );
}

/** 转写结果只读查看（M6 完整工作台前的过渡页）。 */
export function TranscriptViewPanel({ taskId }: TranscriptViewPanelProps) {
  const [task, setTask] = useState<TranscriptionTaskDetail | null>(null);
  const [transcript, setTranscript] = useState<TranscriptionTranscriptDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [taskData, transcriptData] = await Promise.all([
        getTask(taskId),
        getTranscript(taskId),
      ]);
      setTask(taskData);
      setTranscript(transcriptData);
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
        <Skeleton className="h-64 w-full" />
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
          <AlertDescription>{error ?? "无法加载转写结果"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const asrText = extractAsrPlainText(transcript?.asrRawJson ?? null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
      </div>

      {task.status !== "completed" ? (
        <Alert>
          <AlertDescription>
            任务尚未完成，完成后才可查看完整文稿。
          </AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="polished">
        <TabsList>
          <TabsTrigger value="polished">润色文稿</TabsTrigger>
          <TabsTrigger value="summary">法律摘要</TabsTrigger>
          {asrText ? <TabsTrigger value="asr">原始识别</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="polished">
          <Card>
            <CardHeader>
              <CardTitle>润色文稿</CardTitle>
              <CardDescription>LLM 润色后的正文</CardDescription>
            </CardHeader>
            <CardContent>
              <TranscriptBody
                text={transcript?.polishedText ?? null}
                emptyLabel="暂无润色文稿"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>法律摘要</CardTitle>
              <CardDescription>基于文稿生成的法律要点摘要</CardDescription>
            </CardHeader>
            <CardContent>
              <TranscriptBody
                text={transcript?.summaryText ?? null}
                emptyLabel="暂无法律摘要"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {asrText ? (
          <TabsContent value="asr">
            <Card>
              <CardHeader>
                <CardTitle>原始识别</CardTitle>
                <CardDescription>ASR 直接输出的文本</CardDescription>
              </CardHeader>
              <CardContent>
                <TranscriptBody text={asrText} emptyLabel="暂无识别文本" />
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
