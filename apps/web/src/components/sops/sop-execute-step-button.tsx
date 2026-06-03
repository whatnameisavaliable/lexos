"use client";

import { useState } from "react";
import { SopExecutionType, type SopExecutionType as SopExecutionTypeValue } from "@lexos/shared";
import { executeSopStep } from "@/lib/lawyer-sops-api";
import { toApiClientError, ApiClientError } from "@/lib/api-client";
import { sopExecuteErrorToastMessage } from "@/lib/sop-execute-errors";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

export const SOP_DEEP_RESEARCH_DISABLED_TOOLTIP =
  "律所已关闭外网深度研究，该步骤暂不可执行";

/** Deep Research 步骤是否应禁用执行。 */
export function isDeepResearchExecuteDisabled(
  executionType: SopExecutionTypeValue,
  deepResearchEnabled: boolean,
): boolean {
  return (
    executionType === SopExecutionType.ASYNC_DEEP_RESEARCH && !deepResearchEnabled
  );
}

export interface SopExecuteStepButtonProps {
  readonly pipelineId: string;
  readonly stepCode: string;
  readonly executionType: SopExecutionTypeValue;
  readonly deepResearchEnabled: boolean;
  readonly formValues: Record<string, unknown>;
  readonly onExecuted?: () => void;
}

/** 执行当前步骤（200 同步 / 202 异步）。 */
export function SopExecuteStepButton({
  pipelineId,
  stepCode,
  executionType,
  deepResearchEnabled,
  formValues,
  onExecuted,
}: SopExecuteStepButtonProps) {
  const [loading, setLoading] = useState(false);
  const disabled = isDeepResearchExecuteDisabled(executionType, deepResearchEnabled);

  async function handleExecute() {
    setLoading(true);
    try {
      const result = await executeSopStep(pipelineId, stepCode, { formValues });
      if (result.kind === "async") {
        toast.message("已提交，请等待轮询");
      } else {
        toast.success("步骤执行完成");
      }
      onExecuted?.();
    } catch (err) {
      const apiErr = toApiClientError(err);
      const custom = sopExecuteErrorToastMessage(apiErr.code);
      toast.error(custom ?? apiErr.message);
      if (err instanceof ApiClientError) {
        /* handled */
      }
    } finally {
      setLoading(false);
    }
  }

  const button = (
    <Button
      type="button"
      disabled={disabled || loading}
      onClick={() => void handleExecute()}
    >
      {loading && executionType === SopExecutionType.SYNC_LLM
        ? "执行中…"
        : "执行步骤"}
    </Button>
  );

  if (!disabled) {
    return button;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block">{button}</span>
        </TooltipTrigger>
        <TooltipContent>{SOP_DEEP_RESEARCH_DISABLED_TOOLTIP}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
