"use client";

import Link from "next/link";
import type { TranscriptionTaskSummary } from "@lexos/shared";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TaskStatusBadge } from "./task-status-badge";
import { TaskRetryActions } from "./task-retry-actions";
import { formatDurationSec } from "./format-duration";

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "short",
  timeStyle: "short",
});

export interface TranscriptionTasksTableProps {
  readonly items: readonly TranscriptionTaskSummary[];
  readonly onRetried?: () => void;
}

/** 转写任务列表表格（`ui_design.md` §6.3.1 / §6.5）。 */
export function TranscriptionTasksTable({
  items,
  onRetried,
}: TranscriptionTasksTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="h-9">
          <TableHead>任务名</TableHead>
          <TableHead className="text-center">状态</TableHead>
          <TableHead className="text-right">时长</TableHead>
          <TableHead>创建时间</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((task) => {
          const partialSuccess =
            task.status === "completed" &&
            (task.llmPolishFailed === true || task.llmSummaryFailed === true);
          const canOpen =
            task.status === "completed" || partialSuccess;
          return (
          <TableRow key={task.id} className="h-10 text-sm">
            <TableCell className="font-medium max-w-[240px] truncate">
              {canOpen ? (
                <Link
                  href={`/transcription/${task.id}`}
                  className="text-primary hover:underline"
                >
                  {task.title}
                </Link>
              ) : (
                task.title
              )}
            </TableCell>
            <TableCell className="text-center">
              <TaskStatusBadge
                status={task.status}
                partialSuccess={partialSuccess}
              />
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatDurationSec(task.durationSec)}
            </TableCell>
            <TableCell>
              {dateFormatter.format(new Date(task.createdAt))}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex flex-wrap items-center justify-end gap-2">
                {canOpen ? (
                  <Button variant="link" size="sm" className="h-auto px-0" asChild>
                    <Link href={`/transcription/${task.id}`}>打开工作台</Link>
                  </Button>
                ) : null}
                <TaskRetryActions
                  taskId={task.id}
                  status={task.status}
                  llmPolishFailed={task.llmPolishFailed}
                  llmSummaryFailed={task.llmSummaryFailed}
                  onRetried={onRetried}
                />
              </div>
            </TableCell>
          </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
