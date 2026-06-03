"use client";

import { useState } from "react";
import { finalizeSopStep } from "@/lib/lawyer-sops-api";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

export const SOP_FINALIZE_VERIFY_TOOLTIP = "请先完成幻觉校验（Verified）后再定稿";

/** 定稿按钮是否因未校验而禁用。 */
export function isSopFinalizeBlocked(
  requiresVerification: boolean,
  artifactVerified: boolean,
): boolean {
  return requiresVerification && !artifactVerified;
}

export interface SopFinalizeStepButtonProps {
  readonly pipelineId: string;
  readonly stepCode: string;
  readonly requiresVerification: boolean;
  readonly artifactVerified: boolean;
  readonly onFinalized?: () => void;
}

/** 步骤定稿（需 Verified 时门禁）。 */
export function SopFinalizeStepButton({
  pipelineId,
  stepCode,
  requiresVerification,
  artifactVerified,
  onFinalized,
}: SopFinalizeStepButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const blocked = isSopFinalizeBlocked(requiresVerification, artifactVerified);

  async function confirmFinalize() {
    setLoading(true);
    try {
      await finalizeSopStep(pipelineId, stepCode);
      toast.success("步骤已定稿");
      setOpen(false);
      onFinalized?.();
    } catch (err) {
      toast.error(toApiClientError(err).message);
    } finally {
      setLoading(false);
    }
  }

  const trigger = (
    <Button type="button" variant="default" disabled={blocked || loading}>
      定稿
    </Button>
  );

  const wrappedTrigger = blocked ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block">{trigger}</span>
        </TooltipTrigger>
        <TooltipContent>{SOP_FINALIZE_VERIFY_TOOLTIP}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    trigger
  );

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{wrappedTrigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认定稿</AlertDialogTitle>
          <AlertDialogDescription>
            定稿后产出物将不可再编辑，并触发 PDF 归档流程。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>取消</AlertDialogCancel>
          <AlertDialogAction disabled={loading} onClick={() => void confirmFinalize()}>
            {loading ? "提交中…" : "确认定稿"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
