"use client";

import { useState } from "react";
import { toast } from "sonner";
import { patchTranscript } from "@/lib/transcription-api";
import { getCachedTranscriptVersion } from "@/lib/transcript-if-match";
import { toApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

export interface TranscriptSaveToolbarProps {
  readonly taskId: string;
  readonly polishedText: string;
  readonly onSaved: (version: number) => void;
}

/** 编辑模式保存工具栏（PATCH + `If-Match`）。 */
export function TranscriptSaveToolbar({
  taskId,
  polishedText,
  onSaved,
}: TranscriptSaveToolbarProps) {
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const version = getCachedTranscriptVersion(taskId);
    if (version == null) {
      toast.error("缺少文稿版本号，请刷新后重试");
      return;
    }

    setSaving(true);
    try {
      const result = await patchTranscript(taskId, polishedText, version);
      onSaved(result.version);
      toast.success("文稿已保存");
    } catch (err) {
      const apiErr = toApiClientError(err);
      if (apiErr.code === "RESOURCE_CONFLICT") {
        toast.error("文稿已被他人修改，请刷新后重试");
      } else {
        toast.error(apiErr.message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Button type="button" size="sm" disabled={saving} onClick={() => void handleSave()}>
      {saving ? "保存中…" : "保存文稿"}
    </Button>
  );
}
