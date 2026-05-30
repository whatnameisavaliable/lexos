"use client";

import type { DriveNodeSummary } from "@lexos/shared";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Folder, FileText } from "lucide-react";
import { ArchiveFolderBadge } from "./archive-folder-badge";
import { DriveNodeActionsMenu } from "./drive-node-actions-menu";

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatSize(bytes: number | null): string {
  if (bytes == null) {
    return "—";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface DriveNodesTableProps {
  readonly items: readonly DriveNodeSummary[];
  readonly onOpenFolder: (node: DriveNodeSummary) => void;
  readonly onDownloadFile: (node: DriveNodeSummary) => void;
  readonly onRenamed: () => void;
  readonly onMoved: () => void;
  readonly onDeleted: () => void;
}

/** 云盘当前目录表格（`ui_design.md` §6.5）。 */
export function DriveNodesTable({
  items,
  onOpenFolder,
  onDownloadFile,
  onRenamed,
  onMoved,
  onDeleted,
}: DriveNodesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="h-9">
          <TableHead>名称</TableHead>
          <TableHead className="text-center">类型</TableHead>
          <TableHead className="text-right">大小</TableHead>
          <TableHead>更新时间</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((node) => (
          <TableRow key={node.id} className="h-10 text-sm">
            <TableCell className="font-medium max-w-[280px]">
              <div className="flex items-center gap-2 min-w-0">
                {node.nodeType === "folder" ? (
                  <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                {node.nodeType === "folder" ? (
                  <button
                    type="button"
                    className="truncate text-left text-primary hover:underline"
                    onClick={() => onOpenFolder(node)}
                  >
                    {node.name}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="truncate text-left hover:underline"
                    onClick={() => onDownloadFile(node)}
                  >
                    {node.name}
                  </button>
                )}
                <ArchiveFolderBadge node={node} />
              </div>
            </TableCell>
            <TableCell className="text-center">
              {node.nodeType === "folder" ? "文件夹" : "文件"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatSize(node.sizeBytes)}
            </TableCell>
            <TableCell>
              {dateFormatter.format(new Date(node.updatedAt))}
            </TableCell>
            <TableCell className="text-right">
              <DriveNodeActionsMenu
                node={node}
                onRenamed={onRenamed}
                onMoved={onMoved}
                onDeleted={onDeleted}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
