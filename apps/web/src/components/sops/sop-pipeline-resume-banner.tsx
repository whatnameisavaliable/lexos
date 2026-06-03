"use client";

import { useState } from "react";
import { resumeSopPipeline } from "@/lib/lawyer-sops-api";
import { toApiClientError } from "@/lib/api-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface SopPipelineResumeBannerProps {
  readonly pipelineId: string;
  readonly onResumed?: () => void;
}

/** `suspended` 流水线恢复条。 */
export function SopPipelineResumeBanner({
  pipelineId,
  onResumed,
}: SopPipelineResumeBannerProps) {
  const [loading, setLoading] = useState(false);

  async function handleResume() {
    setLoading(true);
    try {
      await resumeSopPipeline(pipelineId);
      toast.success("流水线已恢复");
      onResumed?.();
    } catch (err) {
      toast.error(toApiClientError(err).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Alert>
      <AlertTitle>流水线已挂起</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center gap-2">
        <span>当前流水线处于挂起状态，恢复后可继续执行步骤。</span>
        <Button
          type="button"
          size="sm"
          disabled={loading}
          onClick={() => void handleResume()}
        >
          {loading ? "恢复中…" : "恢复流水线"}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
