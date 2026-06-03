"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createSopPipeline } from "@/lib/lawyer-sops-api";
import { toApiClientError } from "@/lib/api-client";
import { lawyerSopPipelinePath } from "@/lib/sop-pipeline-poll-utils";
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
import { toast } from "sonner";

export interface CreatePipelineFromTemplateDialogProps {
  readonly templateVersionId: string;
  readonly templateName: string;
  readonly onCreated?: () => void;
  readonly trigger: ReactNode;
}

/** 从已发布模板创建流水线并跳转工作区。 */
export function CreatePipelineFromTemplateDialog({
  templateVersionId,
  templateName,
  onCreated,
  trigger,
}: CreatePipelineFromTemplateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function confirmCreate() {
    setSubmitting(true);
    try {
      const pipeline = await createSopPipeline({ templateVersionId });
      toast.success(`已创建流水线：${templateName}`);
      setOpen(false);
      onCreated?.();
      router.push(lawyerSopPipelinePath(pipeline.id));
    } catch (err) {
      toast.error(toApiClientError(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>新建流水线</AlertDialogTitle>
          <AlertDialogDescription>
            将基于模板「{templateName}」创建新的案件流水线，确认继续？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>取消</AlertDialogCancel>
          <AlertDialogAction disabled={submitting} onClick={() => void confirmCreate()}>
            {submitting ? "创建中…" : "确认创建"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
