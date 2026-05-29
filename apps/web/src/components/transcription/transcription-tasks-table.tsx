"use client";

import type { TranscriptionTaskSummary } from "@lexos/shared";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TaskStatusBadge } from "./task-status-badge";
import { formatDurationSec } from "./format-duration";

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "short",
  timeStyle: "short",
});

export interface TranscriptionTasksTableProps {
  readonly items: readonly TranscriptionTaskSummary[];
}

/** 转写任务列表表格（`ui_design.md` §6.3.1 / §6.5）。 */
export function TranscriptionTasksTable({
  items,
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
        {items.map((task) => (
          <TableRow key={task.id} className="h-10 text-sm">
            <TableCell className="font-medium max-w-[240px] truncate">
              {task.title}
            </TableCell>
            <TableCell className="text-center">
              <TaskStatusBadge status={task.status} />
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatDurationSec(task.durationSec)}
            </TableCell>
            <TableCell>
              {dateFormatter.format(new Date(task.createdAt))}
            </TableCell>
            <TableCell className="text-right text-muted-foreground">—</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
