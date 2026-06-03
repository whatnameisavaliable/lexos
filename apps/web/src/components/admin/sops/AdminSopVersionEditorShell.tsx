"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  SopExecutionType,
  type AdminSopTemplateStepDetail,
  type AdminSopTemplateVersionDetail,
} from "@lexos/shared";
import {
  getAdminSopTemplateVersion,
  upsertAdminSopVersionPrompts,
} from "@/lib/admin-sops-api";
import { toApiClientError } from "@/lib/api-client";
import { SopPublishedReadonlyBanner } from "@/components/admin/sops/sop-published-readonly-banner";
import { SopVersionEditorToolbar } from "@/components/admin/sops/sop-version-editor-toolbar";
import { SopStepsList } from "@/components/admin/sops/sop-steps-list";
import {
  SopStepEditorForm,
  type SopStepEditorValues,
} from "@/components/admin/sops/sop-step-editor-form";
import { SopInputSchemaEditor } from "@/components/admin/sops/sop-input-schema-editor";
import {
  buildStepsUpsertBody,
  isVersionEditorReadOnly,
} from "@/components/admin/sops/sop-version-editor-utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export interface AdminSopVersionEditorShellProps {
  readonly versionId: string;
}

function createEmptyStep(index: number): AdminSopTemplateStepDetail {
  const code = `step_${index + 1}`;
  return {
    id: code,
    stepCode: code,
    name: `步骤 ${index + 1}`,
    executionType: SopExecutionType.MANUAL,
    aiFeatureKey: null,
    promptTemplateId: null,
    inputSchema: { type: "object", properties: {} },
    dependsOn: [],
    requiresVerification: false,
    createdAt: new Date().toISOString(),
  };
}

/** 版本编辑壳：Grid 侧栏 + 主区（`ui_design.md` §3）。 */
export function AdminSopVersionEditorShell({
  versionId,
}: AdminSopVersionEditorShellProps) {
  const [detail, setDetail] = useState<AdminSopTemplateVersionDetail | null>(null);
  const [steps, setSteps] = useState<AdminSopTemplateStepDetail[]>([]);
  const [selectedStepCode, setSelectedStepCode] = useState<string | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminSopTemplateVersion(versionId);
      setDetail(data);
      setSteps([...data.steps]);
      setSelectedStepCode(data.steps[0]?.stepCode ?? null);
    } catch (err) {
      const message = toApiClientError(err).message;
      setError(message);
      toast.error(message);
      setDetail(null);
      setSteps([]);
    } finally {
      setLoading(false);
    }
  }, [versionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedStep = useMemo(
    () => steps.find((s) => s.stepCode === selectedStepCode) ?? null,
    [steps, selectedStepCode],
  );

  const readOnly = detail ? isVersionEditorReadOnly(detail.isPublished) : false;
  const stepCodes = steps.map((s) => s.stepCode);

  function updateSelectedStep(partial: Partial<AdminSopTemplateStepDetail>) {
    if (!selectedStepCode) {
      return;
    }
    setSteps((prev) =>
      prev.map((step) =>
        step.stepCode === selectedStepCode ? { ...step, ...partial } : step,
      ),
    );
  }

  function handleStepFormChange(values: SopStepEditorValues) {
    const prevCode = selectedStepCode;
    updateSelectedStep({
      ...values,
      stepCode: values.stepCode,
    });
    if (prevCode && prevCode !== values.stepCode) {
      setSelectedStepCode(values.stepCode);
      setSteps((prev) =>
        prev.map((step) => ({
          ...step,
          dependsOn: step.dependsOn.map((dep) =>
            dep === prevCode ? values.stepCode : dep,
          ),
        })),
      );
    }
  }

  function handleAddStep() {
    const next = createEmptyStep(steps.length);
    setSteps((prev) => [...prev, next]);
    setSelectedStepCode(next.stepCode);
  }

  function handleRemoveStep(stepCode: string) {
    setSteps((prev) =>
      prev
        .filter((s) => s.stepCode !== stepCode)
        .map((s) => ({
          ...s,
          dependsOn: s.dependsOn.filter((dep) => dep !== stepCode),
        })),
    );
    if (selectedStepCode === stepCode) {
      setSelectedStepCode(null);
    }
  }

  async function handleSave() {
    if (readOnly) {
      toast.error("已发布版本只读，请新建版本草稿");
      return;
    }
    if (schemaError) {
      toast.error(schemaError);
      return;
    }
    if (steps.length === 0) {
      toast.error("至少需要一个步骤");
      return;
    }

    setSaving(true);
    try {
      await upsertAdminSopVersionPrompts(versionId, buildStepsUpsertBody(steps));
      toast.success("步骤已保存");
      await load();
    } catch (err) {
      const apiErr = toApiClientError(err);
      toast.error(
        apiErr.code === "OPERATION_NOT_ALLOWED"
          ? "已发布版本只读，请新建版本草稿"
          : apiErr.message,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : null}

      {!loading && error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!loading && detail ? (
        <>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {detail.templateName} · v{detail.versionNumber}
            </h1>
            <SopPublishedReadonlyBanner isPublished={detail.isPublished} />
            <SopVersionEditorToolbar
              versionId={detail.versionId}
              templateId={detail.templateId}
              isPublished={detail.isPublished}
              stepCodes={stepCodes}
              onSave={() => void handleSave()}
              saving={saving}
              onAddStep={handleAddStep}
              onPublished={() => void load()}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
            <aside>
              <SopStepsList
                steps={steps}
                selectedStepCode={selectedStepCode}
                onSelect={setSelectedStepCode}
                readOnly={readOnly}
                onRemove={readOnly ? undefined : handleRemoveStep}
              />
            </aside>
            <main className="flex flex-col gap-4 rounded-md border p-4">
              {selectedStep ? (
                <>
                  <SopStepEditorForm
                    step={selectedStep}
                    allStepCodes={stepCodes}
                    readOnly={readOnly}
                    onChange={handleStepFormChange}
                  />
                  <SopInputSchemaEditor
                    value={selectedStep.inputSchema}
                    readOnly={readOnly}
                    onChange={(next) => updateSelectedStep({ inputSchema: next })}
                    onValidationChange={setSchemaError}
                  />
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  选择左侧步骤或点击「添加步骤」开始编辑。
                </p>
              )}
            </main>
          </div>
        </>
      ) : null}
    </div>
  );
}

import { shouldToastLoadError } from "@/components/admin/sops/sop-admin-ui-utils";