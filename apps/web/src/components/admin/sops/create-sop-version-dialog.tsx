"use client";

import { useState } from "react";
import { createAdminSopTemplateVersion } from "@/lib/admin-sops-api";
import { toApiClientError } from "@/lib/api-client";
import { adminSopVersionEditorPath } from "@/components/admin/sops/sop-version-editor-utils";
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
import { useRouter } from "next/navigation";

export interface CreateSopVersionDialogProps {
  readonly templateId: string;
  readonly disabled?: boolean;
}

/** 基于已发布版本新建草稿。 */
export function CreateSopVersionDialog({
  templateId,
  disabled = false,
}: CreateSopVersionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const created = await createAdminSopTemplateVersion(templateId);
      setOpen(false);
      toast.success("已新建版本草稿");
      router.push(adminSopVersionEditorPath(created.versionId));
    } catch (err) {
      toast.error(toApiClientError(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          新建版本草稿
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>新建版本草稿？</AlertDialogTitle>
          <AlertDialogDescription>
            将复制最新已发布版本的步骤与 Prompt 绑定，生成新的可编辑草稿。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>取消</AlertDialogCancel>
          <AlertDialogAction disabled={submitting} onClick={() => void handleConfirm()}>
            {submitting ? "创建中…" : "确认"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
