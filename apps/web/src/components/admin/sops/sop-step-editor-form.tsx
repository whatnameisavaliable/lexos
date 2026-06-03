"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import {
  SOP_AI_FEATURE_KEY_VALUES,
  SopExecutionType,
  type AdminSopTemplateStepDetail,
  type SopAiFeatureKey,
} from "@lexos/shared";
import { AI_FEATURE_LABELS } from "@/components/admin/ai/feature-labels";
import { executionTypeLabel } from "@/components/admin/sops/sop-execution-type-label";
import { SopDependsOnMultiSelect } from "@/components/admin/sops/sop-depends-on-multi-select";
import { SopMustacheHint } from "@/components/admin/sops/sop-mustache-hint";
import { listPrompts, type AiPromptData } from "@/lib/admin-ai-api";
import { useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export type SopStepEditorValues = Pick<
  AdminSopTemplateStepDetail,
  | "stepCode"
  | "name"
  | "executionType"
  | "aiFeatureKey"
  | "promptTemplateId"
  | "dependsOn"
  | "requiresVerification"
>;

export interface SopStepEditorFormProps {
  readonly step: SopStepEditorValues;
  readonly allStepCodes: readonly string[];
  readonly readOnly?: boolean;
  readonly onChange: (values: SopStepEditorValues) => void;
}

import { shouldShowAiFields } from "@/components/admin/sops/sop-admin-ui-utils";
/** 步骤编辑表单（RHF）。 */
export function SopStepEditorForm({
  step,
  allStepCodes,
  readOnly = false,
  onChange,
}: SopStepEditorFormProps) {
  const form = useForm<SopStepEditorValues>({ defaultValues: step });
  const [prompts, setPrompts] = useState<readonly AiPromptData[]>([]);

  useEffect(() => {
    form.reset(step);
  }, [form, step]);

  useEffect(() => {
    void listPrompts()
      .then((res) => setPrompts(res.items))
      .catch(() => setPrompts([]));
  }, []);

  const executionType = form.watch("executionType");
  const aiFeatureKey = form.watch("aiFeatureKey");
  const showAi = shouldShowAiFields(executionType);

  const filteredPrompts = useMemo(
    () =>
      prompts.filter(
        (p) => !aiFeatureKey || p.featureKey === aiFeatureKey,
      ),
    [prompts, aiFeatureKey],
  );

  useEffect(() => {
    const subscription = form.watch((values) => {
      onChange({
        stepCode: values.stepCode ?? step.stepCode,
        name: values.name ?? "",
        executionType: values.executionType ?? SopExecutionType.MANUAL,
        aiFeatureKey: values.aiFeatureKey ?? null,
        promptTemplateId: values.promptTemplateId ?? null,
        dependsOn: values.dependsOn ?? [],
        requiresVerification: values.requiresVerification ?? false,
      });
    });
    return () => subscription.unsubscribe();
  }, [form, onChange, step.stepCode]);

  return (
    <Form {...form}>
      <form className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="stepCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>步骤代码</FormLabel>
              <FormControl>
                <Input {...field} disabled={readOnly} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>步骤名称</FormLabel>
              <FormControl>
                <Input {...field} disabled={readOnly} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="executionType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>执行类型</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={readOnly}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(SopExecutionType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {executionTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {showAi ? (
          <FormField
            control={form.control}
            name="aiFeatureKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>AI 功能点</FormLabel>
                <Select
                  value={field.value ?? undefined}
                  onValueChange={(v) => field.onChange(v as SopAiFeatureKey)}
                  disabled={readOnly}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择功能点" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SOP_AI_FEATURE_KEY_VALUES.map((key) => (
                      <SelectItem key={key} value={key}>
                        {AI_FEATURE_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
        {showAi ? (
          <FormField
            control={form.control}
            name="promptTemplateId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prompt 模板</FormLabel>
                <Select
                  value={field.value ?? undefined}
                  onValueChange={field.onChange}
                  disabled={readOnly}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择 Prompt" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredPrompts.map((prompt) => (
                      <SelectItem key={prompt.id} value={prompt.id}>
                        {prompt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
        <FormField
          control={form.control}
          name="dependsOn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>前置步骤 (depends_on)</FormLabel>
              <SopDependsOnMultiSelect
                options={allStepCodes.filter((code) => code !== step.stepCode)}
                value={field.value ?? []}
                onChange={field.onChange}
                disabled={readOnly}
              />
              <SopMustacheHint stepCode={step.stepCode} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="requiresVerification"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <FormLabel>需要人工核验</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={readOnly}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
