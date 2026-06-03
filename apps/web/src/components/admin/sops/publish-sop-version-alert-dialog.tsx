"use client";

import { useState } from "react";
import { publishAdminSopTemplateVersion } from "@/lib/admin-sops-api";
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

export interface PublishSopVersionAlertDialogProps {
  readonly versionId: string;
  readonly disabled?: boolean;
  readonly onPublished: () => void;
}

/** 发布版本二次确认。 */
export function PublishSopVersionAlertDialog({
  versionId,
  disabled = false,
  onPublished,
}: PublishSopVersionAlertDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const result = await publishAdminSopTemplateVersion(versionId);
      setOpen(false);
      toast.success(`已发布 v${result.versionNumber}`);
      onPublished();
    } catch (err) {
      const apiErr = toApiClientError(err);
      toast.error(formatPublishError(apiErr.message, apiErr.code));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="default" disabled={disabled}>
          发布
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>发布此版本？</AlertDialogTitle>
          <AlertDialogDescription>
            发布后将变为只读；律师端可见。请确认步骤 DAG、Prompt 与 AI 映射均已配置完整。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>取消</AlertDialogCancel>
          <AlertDialogAction disabled={submitting} onClick={() => void handleConfirm()}>
            {submitting ? "发布中…" : "确认发布"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

import { formatPublishError } from "@/components/admin/sops/sop-admin-ui-utils";