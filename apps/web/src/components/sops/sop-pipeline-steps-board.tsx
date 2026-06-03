"use client";

import type { SopPipelineStepStatusItem } from "@lexos/shared";
import { cn } from "@/lib/utils";
import { SopArtifactStatusBadge } from "./sop-artifact-status-badge";
import { SopExecutionTypeHint } from "./sop-execution-type-hint";

export interface SopPipelineStepsBoardProps {
  readonly steps: readonly SopPipelineStepStatusItem[];
  readonly currentStepCode: string | null;
  readonly selectedStepCode: string | null;
  readonly onSelectStep: (stepCode: string) => void;
}

/** 流水线步骤侧栏看板。 */
export function SopPipelineStepsBoard({
  steps,
  currentStepCode,
  selectedStepCode,
  onSelectStep,
}: SopPipelineStepsBoardProps) {
  return (
    <nav className="flex flex-col gap-2" aria-label="流水线步骤">
      {steps.map((step) => {
        const isCurrent = step.stepCode === currentStepCode;
        const isSelected = step.stepCode === selectedStepCode;
        return (
          <button
            key={step.stepCode}
            type="button"
            onClick={() => onSelectStep(step.stepCode)}
            className={cn(
              "flex flex-col gap-1 rounded-md border p-3 text-left transition-colors",
              isSelected && "border-primary bg-muted/50",
              !isSelected && "hover:bg-muted/30",
              isCurrent && "ring-1 ring-primary/40",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-sm">{step.name}</span>
              {step.artifactStatus ? (
                <SopArtifactStatusBadge status={step.artifactStatus} />
              ) : (
                <span className="text-muted-foreground text-xs">未开始</span>
              )}
            </div>
            <SopExecutionTypeHint executionType={step.executionType} />
          </button>
        );
      })}
    </nav>
  );
}
