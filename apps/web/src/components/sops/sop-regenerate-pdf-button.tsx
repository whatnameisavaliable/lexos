"use client";

import { useState } from "react";
import type { PipelineArtifactStatus } from "@lexos/shared";
import { regenerateSopArtifactPdf } from "@/lib/lawyer-sops-api";
import { toApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/** 是否展示 PDF 重生成按钮。 */
export function shouldShowRegeneratePdfButton(
  status: PipelineArtifactStatus,
): boolean {
  return status === "finalized";
}

export interface SopRegeneratePdfButtonProps {
  readonly artifactId: string;
  readonly artifactStatus: PipelineArtifactStatus;
}

/** 已定稿产出物 PDF 重试入队。 */
export function SopRegeneratePdfButton({
  artifactId,
  artifactStatus,
}: SopRegeneratePdfButtonProps) {
  const [loading, setLoading] = useState(false);

  if (!shouldShowRegeneratePdfButton(artifactStatus)) {
    return null;
  }

  async function handleRegenerate() {
    setLoading(true);
    try {
      await regenerateSopArtifactPdf(artifactId);
      toast.message("PDF 重新生成已入队");
    } catch (err) {
      toast.error(toApiClientError(err).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={() => void handleRegenerate()}
    >
      {loading ? "提交中…" : "重新生成 PDF"}
    </Button>
  );
}
