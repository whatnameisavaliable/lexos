"use client";

import { Button } from "@/components/ui/button";
import { isVersionEditorReadOnly } from "@/components/admin/sops/sop-version-editor-utils";
import { CreateSopVersionDialog } from "@/components/admin/sops/create-sop-version-dialog";
import { PublishSopVersionAlertDialog } from "@/components/admin/sops/publish-sop-version-alert-dialog";
import { SopPreviewPipelineDialog } from "@/components/admin/sops/sop-preview-pipeline-dialog";

export interface SopVersionEditorToolbarProps {
  readonly versionId: string;
  readonly templateId: string;
  readonly isPublished: boolean;
  readonly stepCodes: readonly string[];
  readonly onSave: () => void;
  readonly saving?: boolean;
  readonly onAddStep: () => void;
  readonly onPublished: () => void;
}

/** 版本编辑工具栏。 */
export function SopVersionEditorToolbar({
  versionId,
  templateId,
  isPublished,
  stepCodes,
  onSave,
  saving = false,
  onAddStep,
  onPublished,
}: SopVersionEditorToolbarProps) {
  const readOnly = isVersionEditorReadOnly(isPublished);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={onSave} disabled={readOnly || saving}>
        {saving ? "保存中…" : "保存步骤"}
      </Button>
      <Button variant="outline" onClick={onAddStep} disabled={readOnly}>
        添加步骤
      </Button>
      <PublishSopVersionAlertDialog
        versionId={versionId}
        disabled={readOnly}
        onPublished={onPublished}
      />
      <CreateSopVersionDialog templateId={templateId} disabled={!isPublished} />
      <SopPreviewPipelineDialog
        templateVersionId={versionId}
        stepCodes={stepCodes}
        disabled={stepCodes.length === 0}
      />
    </div>
  );
}

/** 保存按钮是否应禁用（测试用）。 */
export function isSaveStepsDisabled(isPublished: boolean, saving: boolean): boolean {
  return isVersionEditorReadOnly(isPublished) || saving;
}
