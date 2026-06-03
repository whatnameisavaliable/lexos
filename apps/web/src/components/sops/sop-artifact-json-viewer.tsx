"use client";

import { useEffect, useState } from "react";
import type { PipelineArtifactStatus } from "@lexos/shared";
import { patchSopArtifact } from "@/lib/lawyer-sops-api";
import { toApiClientError, ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

/** JSON 产出物是否只读。 */
export function isSopJsonArtifactReadOnly(status: PipelineArtifactStatus): boolean {
  return status === "finalized";
}

export interface SopArtifactJsonViewerProps {
  readonly artifactId: string;
  readonly version: number;
  readonly status: PipelineArtifactStatus;
  readonly contentRaw: string;
  readonly onPatched?: (contentRaw: string, version: number) => void;
}

/** JSON 产出物编辑/只读。 */
export function SopArtifactJsonViewer({
  artifactId,
  version,
  status,
  contentRaw,
  onPatched,
}: SopArtifactJsonViewerProps) {
  const [draft, setDraft] = useState(contentRaw);
  const [saving, setSaving] = useState(false);
  const readOnly = isSopJsonArtifactReadOnly(status);

  useEffect(() => {
    setDraft(contentRaw);
  }, [contentRaw]);

  async function save() {
    setSaving(true);
    try {
      const result = await patchSopArtifact(artifactId, version, {
        contentRaw: draft,
      });
      toast.success("草稿已保存");
      onPatched?.(result.contentRaw, result.version);
    } catch (err) {
      const apiErr = toApiClientError(err);
      if (apiErr.code === "RESOURCE_CONFLICT") {
        toast.error("版本冲突，请刷新");
      } else {
        toast.error(apiErr.message);
      }
      if (err instanceof ApiClientError) {
        /* handled */
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={draft}
        readOnly={readOnly}
        rows={16}
        className="font-mono text-sm"
        onChange={(e) => setDraft(e.target.value)}
      />
      {!readOnly ? (
        <Button type="button" disabled={saving} onClick={() => void save()}>
          {saving ? "保存中…" : "保存草稿"}
        </Button>
      ) : null}
    </div>
  );
}
