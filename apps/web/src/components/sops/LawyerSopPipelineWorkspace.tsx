"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  SopExecutionType,
  type SopPipelineStatusResponse,
} from "@lexos/shared";
import { useSopPipelineStatusPoll } from "@/hooks/use-sop-pipeline-status-poll";
import {
  detectSopArtifactStatusTransitions,
  sopArtifactTransitionToastMessage,
} from "@/lib/sop-pipeline-poll-utils";
import { pipelineStatusLabel } from "./sop-pipeline-status-label";
import { SopPipelineStepsBoard } from "./sop-pipeline-steps-board";
import { SopPipelineResumeBanner } from "./sop-pipeline-resume-banner";
import { SopPipelineCloseDialog } from "./sop-pipeline-close-dialog";
import { SopStepActionPanel } from "./sop-step-action-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export interface LawyerSopPipelineWorkspaceProps {
  readonly pipelineId: string;
}

/** 律师 SOP 流水线工作区（侧栏步骤 + 主操作区）。 */
export function LawyerSopPipelineWorkspace({
  pipelineId,
}: LawyerSopPipelineWorkspaceProps) {
  const [selectedStepCode, setSelectedStepCode] = useState<string | null>(null);
  const [verifiedArtifactIds, setVerifiedArtifactIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [drBannerStepCode, setDrBannerStepCode] = useState<string | null>(null);
  const previousStepsRef = useRef<SopPipelineStatusResponse["steps"]>([]);

  const handleStatus = useCallback((status: SopPipelineStatusResponse) => {
    const transitions = detectSopArtifactStatusTransitions(
      previousStepsRef.current,
      status.steps,
    );
    for (const t of transitions) {
      const step = status.steps.find((s) => s.stepCode === t.stepCode);
      const message = sopArtifactTransitionToastMessage(
        t.transition,
        step?.name,
      );
      if (t.transition === "running_to_draft") {
        toast.success(message);
      } else {
        toast.error(message);
      }
    }
    previousStepsRef.current = status.steps;
  }, []);

  const { status, loading, refresh } = useSopPipelineStatusPoll(pipelineId, {
    onStatus: handleStatus,
  });

  useEffect(() => {
    if (!status) {
      return;
    }
    if (!selectedStepCode && status.currentStepCode) {
      setSelectedStepCode(status.currentStepCode);
    }
  }, [status, selectedStepCode]);

  const selectedStep =
    status?.steps.find((s) => s.stepCode === selectedStepCode) ??
    status?.steps.find((s) => s.stepCode === status.currentStepCode) ??
    status?.steps[0];

  const artifactVerified =
    selectedStep?.artifactId !== null &&
    selectedStep?.artifactId !== undefined &&
    verifiedArtifactIds.has(selectedStep.artifactId);

  if (loading && !status) {
    return (
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!status) {
    return <p className="text-muted-foreground text-sm">无法加载流水线状态</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">流水线工作区</h1>
          <p className="text-muted-foreground text-sm">
            状态：{pipelineStatusLabel(status.status)}
          </p>
        </div>
        <SopPipelineCloseDialog
          pipelineId={pipelineId}
          pipelineStatus={status.status}
          onClosed={() => void refresh()}
        />
      </div>

      {status.status === "suspended" ? (
        <SopPipelineResumeBanner
          pipelineId={pipelineId}
          onResumed={() => void refresh()}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <SopPipelineStepsBoard
          steps={status.steps}
          currentStepCode={status.currentStepCode}
          selectedStepCode={selectedStep?.stepCode ?? null}
          onSelectStep={setSelectedStepCode}
        />
        <div>
          {selectedStep ? (
            <SopStepActionPanel
              pipelineId={pipelineId}
              step={selectedStep}
              deepResearchEnabled={status.deepResearchEnabled}
              showDeepResearchBanner={
                drBannerStepCode === selectedStep.stepCode ||
                !status.deepResearchEnabled
              }
              artifactVerified={artifactVerified}
              onVerified={() => {
                if (selectedStep.artifactId) {
                  setVerifiedArtifactIds((prev) => {
                    const next = new Set(prev);
                    next.add(selectedStep.artifactId!);
                    return next;
                  });
                }
              }}
              onRefresh={() => {
                void refresh();
                if (
                  selectedStep.executionType ===
                  SopExecutionType.ASYNC_DEEP_RESEARCH
                ) {
                  setDrBannerStepCode(selectedStep.stepCode);
                }
              }}
            />
          ) : (
            <p className="text-muted-foreground text-sm">请选择步骤</p>
          )}
        </div>
      </div>
    </div>
  );
}
