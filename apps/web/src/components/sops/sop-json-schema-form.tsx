"use client";

import Form from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import type { RJSFSchema } from "@rjsf/utils";
import { Button } from "@/components/ui/button";
import { coerceSopFormValues } from "@/lib/coerce-sop-form-values";

export interface SopJsonSchemaFormProps {
  readonly inputSchema: Record<string, unknown>;
  readonly onSubmit: (formValues: Record<string, unknown>) => void;
  readonly submitLabel?: string;
  readonly disabled?: boolean;
}

/** RJSF 动态表单（`manual` / execute 前置）。 */
export function SopJsonSchemaForm({
  inputSchema,
  onSubmit,
  submitLabel = "保存表单",
  disabled = false,
}: SopJsonSchemaFormProps) {
  return (
    <Form
      schema={inputSchema as RJSFSchema}
      validator={validator}
      disabled={disabled}
      showErrorList={false}
      onSubmit={({ formData }) => {
        onSubmit(coerceSopFormValues(formData as Record<string, unknown>));
      }}
    >
      <Button type="submit" disabled={disabled} className="mt-4">
        {submitLabel}
      </Button>
    </Form>
  );
}
