"use client";

import { useState } from "react";
import type { CasePipelineStatus } from "@lexos/shared";
import { closeSopPipeline } from "@/lib/lawyer-sops-api";
import { toApiClientError } from "@/lib/api-client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/** 是否展示结案按钮（`completed` 后隐藏）。 */
export function shouldShowSopCloseButton(status: CasePipelineStatus): boolean {
  return status !== "completed";
}

export interface SopPipelineCloseDialogProps {
  readonly pipelineId: string;
  readonly pipelineStatus: CasePipelineStatus;
  readonly onClosed?: () => void;
}

/** 显式结案对话框（禁止自动结案）。 */
export function SopPipelineCloseDialog({
  pipelineId,
  pipelineStatus,
  onClosed,
}: SopPipelineCloseDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!shouldShowSopCloseButton(pipelineStatus)) {
    return null;
  }

  async function confirmClose() {
    setSubmitting(true);
    try {
      await closeSopPipeline(pipelineId);
      toast.success("流水线已结案");
      setOpen(false);
      onClosed?.();
    } catch (err) {
      toast.error(toApiClientError(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          结案
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认结案</AlertDialogTitle>
          <AlertDialogDescription>
            结案后流水线将标记为已完成，无法继续执行步骤。此操作需律师显式确认。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>取消</AlertDialogCancel>
          <AlertDialogAction disabled={submitting} onClick={() => void confirmClose()}>
            {submitting ? "提交中…" : "确认结案"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
