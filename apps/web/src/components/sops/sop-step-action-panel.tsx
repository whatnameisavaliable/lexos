"use client";

import { useState } from "react";
import {
  SopExecutionType,
  type SopExecutionType as SopExecutionTypeValue,
} from "@lexos/shared";
import type { SopPipelineStepStatusItem } from "@lexos/shared";
import { SopJsonSchemaForm } from "./sop-json-schema-form";
import { SopMediaUploadZone } from "./sop-media-upload-zone";
import { SopExecuteStepButton } from "./sop-execute-step-button";
import { SopFinalizeStepButton } from "./sop-finalize-step-button";
import { SopArtifactEditorShell } from "./sop-artifact-editor-shell";
import { SopDeepResearchOfflineBanner } from "./sop-deep-research-offline-banner";

export interface SopStepActionPanelProps {
  readonly pipelineId: string;
  readonly step: SopPipelineStepStatusItem;
  readonly deepResearchEnabled: boolean;
  readonly showDeepResearchBanner?: boolean;
  readonly artifactVerified: boolean;
  readonly onVerified?: () => void;
  readonly onRefresh?: () => void;
}

/** 当前步骤操作区：表单、上传、执行、产出物编辑。 */
export function SopStepActionPanel({
  pipelineId,
  step,
  deepResearchEnabled,
  showDeepResearchBanner = false,
  artifactVerified,
  onVerified,
  onRefresh,
}: SopStepActionPanelProps) {
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});

  const showForm =
    step.executionType === SopExecutionType.MANUAL ||
    Object.keys(step.inputSchema).length > 0;

  return (
    <div className="flex flex-col gap-6">
      {showDeepResearchBanner &&
      step.executionType === SopExecutionType.ASYNC_DEEP_RESEARCH ? (
        <SopDeepResearchOfflineBanner visible={!deepResearchEnabled} />
      ) : null}

      <SopMediaUploadZone pipelineId={pipelineId} onUploaded={onRefresh} />

      {showForm ? (
        <SopJsonSchemaForm
          inputSchema={step.inputSchema}
          submitLabel="应用表单"
          onSubmit={(values) => setFormValues(values)}
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        <SopExecuteStepButton
          pipelineId={pipelineId}
          stepCode={step.stepCode}
          executionType={step.executionType}
          deepResearchEnabled={deepResearchEnabled}
          formValues={formValues}
          onExecuted={onRefresh}
        />
        {step.artifactStatus === "draft" ? (
          <SopFinalizeStepButton
            pipelineId={pipelineId}
            stepCode={step.stepCode}
            requiresVerification={step.requiresVerification}
            artifactVerified={artifactVerified}
            onFinalized={onRefresh}
          />
        ) : null}
      </div>

      {step.artifactId ? (
        <SopArtifactEditorShell
          artifactId={step.artifactId}
          requiresVerification={step.requiresVerification}
          verified={artifactVerified}
          onVerified={onVerified}
          onArtifactUpdated={onRefresh}
        />
      ) : null}
    </div>
  );
}

/** 是否展示 Deep Research 离线 Banner。 */
export function shouldShowDeepResearchOfflineBanner(
  executionType: SopExecutionTypeValue,
  deepResearchEnabled: boolean,
  submittedAsync?: boolean,
): boolean {
  return (
    executionType === SopExecutionType.ASYNC_DEEP_RESEARCH &&
    (!deepResearchEnabled || submittedAsync === true)
  );
}
