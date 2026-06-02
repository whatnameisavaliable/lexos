"use client";

import { useEffect, useState } from "react";
import type { AiPromptData } from "@/lib/admin-ai-api";
import { createPrompt, publishPrompt, updatePrompt } from "@/lib/admin-ai-api";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES,
  type AdminConfigurableFeatureKey,
} from "@lexos/shared";
import { AI_FEATURE_LABELS } from "@/components/admin/ai/feature-labels";
import { toast } from "sonner";

interface AiPromptEditorDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly prompt?: AiPromptData | null;
  readonly onSaved: () => void;
}

/** Prompt 编辑/创建；发布需二次确认。 */
export function AiPromptEditorDialog({
  open,
  onOpenChange,
  prompt,
  onSaved,
}: AiPromptEditorDialogProps) {
  const isEdit = Boolean(prompt);
  const [featureKey, setFeatureKey] = useState<AdminConfigurableFeatureKey>(
    "llm_transcript_polish",
  );
  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFeatureKey(prompt?.featureKey ?? "llm_transcript_polish");
    setName(prompt?.name ?? "");
    setSystemPrompt(prompt?.systemPrompt ?? "");
  }, [open, prompt]);

  async function handleSave() {
    setSubmitting(true);
    try {
      if (isEdit && prompt) {
        await updatePrompt(prompt.id, { name, systemPrompt });
        toast.success("Prompt 已更新");
      } else {
        await createPrompt({ featureKey, name, systemPrompt });
        toast.success("Prompt 已创建");
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(toApiClientError(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePublish() {
    if (!prompt) return;
    setSubmitting(true);
    try {
      await publishPrompt(prompt.id);
      toast.success("已发布");
      setPublishOpen(false);
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(toApiClientError(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  const readOnly = prompt?.isPublished === true;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEdit ? "编辑 Prompt" : "新建 Prompt"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            {!isEdit ? (
              <div className="grid gap-2">
                <Label>功能点</Label>
                <Select
                  value={featureKey}
                  onValueChange={(v) =>
                    setFeatureKey(v as AdminConfigurableFeatureKey)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADMIN_CONFIGURABLE_FEATURE_KEY_VALUES.map((key) => (
                      <SelectItem key={key} value={key}>
                        {AI_FEATURE_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="prompt-name">名称</Label>
              <Input
                id="prompt-name"
                value={name}
                disabled={readOnly}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="system-prompt">System Prompt</Label>
              <Textarea
                id="system-prompt"
                className="min-h-[200px] font-mono text-sm"
                value={systemPrompt}
                disabled={readOnly}
                onChange={(e) => setSystemPrompt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            {isEdit && prompt && !prompt.isPublished ? (
              <Button type="button" variant="secondary" onClick={() => setPublishOpen(true)}>
                发布
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            {!readOnly ? (
              <Button type="button" disabled={submitting} onClick={() => void handleSave()}>
                {submitting ? "保存中…" : "保存"}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={publishOpen} onOpenChange={setPublishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认发布 Prompt？</AlertDialogTitle>
            <AlertDialogDescription>
              发布后将递增版本号并锁定编辑；运行时将使用最新已发布版本。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handlePublish()}>确认发布</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
