"use client";

import type { AdminSopTemplateStepDetail } from "@lexos/shared";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface SopStepsListProps {
  readonly steps: readonly AdminSopTemplateStepDetail[];
  readonly selectedStepCode: string | null;
  readonly onSelect: (stepCode: string) => void;
  readonly readOnly?: boolean;
  readonly onRemove?: (stepCode: string) => void;
}

/** 左侧步骤列表。 */
export function SopStepsList({
  steps,
  selectedStepCode,
  onSelect,
  readOnly = false,
  onRemove,
}: SopStepsListProps) {
  return (
    <ScrollArea className="h-full max-h-[calc(100dvh-16rem)] rounded-md border">
      <div className="flex flex-col gap-1 p-2">
        {steps.length === 0 ? (
          <p className="text-muted-foreground p-2 text-sm">暂无步骤</p>
        ) : null}
        {steps.map((step) => (
          <div key={step.stepCode} className="flex items-center gap-1">
            <Button
              type="button"
              variant={selectedStepCode === step.stepCode ? "default" : "ghost"}
              className={cn("flex-1 justify-start", "font-mono text-sm")}
              onClick={() => onSelect(step.stepCode)}
            >
              {step.stepCode}
            </Button>
            {!readOnly && onRemove ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => onRemove(step.stepCode)}
              >
                删
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
