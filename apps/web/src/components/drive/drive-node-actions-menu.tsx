"use client";

import { useState } from "react";
import type { DriveNodeSummary } from "@lexos/shared";
import { parseDriveNodeUpdateBody } from "@lexos/shared";
import { deleteDriveNode, updateDriveNode } from "@/lib/drive-api";
import { toApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

export interface DriveNodeActionsMenuProps {
  readonly node: DriveNodeSummary;
  readonly onRenamed: () => void;
  readonly onMoved: () => void;
  readonly onDeleted: () => void;
}

/** 云盘节点操作菜单（重命名 / 移动 / 删除）。 */
export function DriveNodeActionsMenu({
  node,
  onRenamed,
  onMoved,
  onDeleted,
}: DriveNodeActionsMenuProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState(node.name);
  const [submitting, setSubmitting] = useState(false);

  async function handleRename() {
    setSubmitting(true);
    try {
      const body = parseDriveNodeUpdateBody({ name });
      await updateDriveNode(node.id, body);
      toast.success("已重命名");
      setRenameOpen(false);
      onRenamed();
    } catch (err) {
      toast.error(toApiClientError(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setSubmitting(true);
    try {
      const result = await deleteDriveNode(node.id);
      toast.success(
        result.deletedCount > 1
          ? `已删除 ${result.deletedCount} 项`
          : "已删除",
      );
      setDeleteOpen(false);
      onDeleted();
    } catch (err) {
      toast.error(toApiClientError(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">操作</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setRenameOpen(true)}>
            重命名
          </DropdownMenuItem>
          {node.nodeType === "folder" ? (
            <DropdownMenuItem
              onSelect={() => {
                toast.info("请在目标目录中使用移动功能（后续版本）");
              }}
            >
              移动
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor={`rename-${node.id}`}>名称</Label>
            <Input
              id={`rename-${node.id}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => void handleRename()}
              disabled={submitting}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除？</AlertDialogTitle>
            <AlertDialogDescription>
              {node.nodeType === "folder" ? (
                <>
                  将删除文件夹「{node.name}」及其中的全部子文件夹与文件（级联删除）。
                  此操作不可撤销。
                </>
              ) : (
                <>将删除「{node.name}」。此操作不可撤销。</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
