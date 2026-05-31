"use client";

import { useState } from "react";
import type { AiPromptData } from "@/lib/admin-ai-api";
import { deletePrompt } from "@/lib/admin-ai-api";
import { toApiClientError } from "@/lib/api-client";
import { AI_FEATURE_LABELS } from "@/components/admin/ai/feature-labels";
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

export interface DeletePromptAlertDialogProps {
  readonly prompt: AiPromptData | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onDone: () => void;
}

/** 删除 Prompt 二次确认。 */
export function DeletePromptAlertDialog({
  prompt,
  open,
  onOpenChange,
  onDone,
}: DeletePromptAlertDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (!prompt) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await deletePrompt(prompt.id);
      onOpenChange(false);
      onDone();
    } catch (err) {
      setError(toApiClientError(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  const featureLabel = prompt
    ? (AI_FEATURE_LABELS[prompt.featureKey] ?? prompt.featureKey)
    : "";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>删除 Prompt 模板？</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              {prompt ? (
                <>
                  <p>
                    将永久删除「{prompt.name}」（{featureLabel}，版本 v
                    {prompt.version}
                    {prompt.isPublished ? "，已发布" : "，草稿"}）。
                  </p>
                  {prompt.isPublished ? (
                    <p className="text-destructive">
                      已发布版本删除后，该功能点将不再有此条 Prompt记录；若仍需运行时使用，请保留或发布其他版本（Worker 消费属后续里程碑）。
                    </p>
                  ) : null}
                </>
              ) : null}
              {error ? <p className="text-destructive">{error}</p> : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>取消</AlertDialogCancel>
          <AlertDialogAction
            disabled={submitting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(e) => {
              e.preventDefault();
              void confirm();
            }}
          >
            {submitting ? "删除中…" : "确认删除"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
