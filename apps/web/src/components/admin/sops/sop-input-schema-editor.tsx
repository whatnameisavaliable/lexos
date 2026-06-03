"use client";

import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { validateJsonSchemaText } from "@/lib/validate-json-schema-text";

export interface SopInputSchemaEditorProps {
  readonly value: Record<string, unknown>;
  readonly readOnly?: boolean;
  readonly onChange: (next: Record<string, unknown>) => void;
  readonly onValidationChange?: (error: string | null) => void;
}

/** `input_schema` JSON 文本编辑器。 */
export function SopInputSchemaEditor({
  value,
  readOnly = false,
  onChange,
  onValidationChange,
}: SopInputSchemaEditorProps) {
  const [text, setText] = useState(() => JSON.stringify(value ?? {}, null, 2));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(JSON.stringify(value ?? {}, null, 2));
  }, [value]);

  function handleBlur() {
    const result = validateJsonSchemaText(text);
    if (!result.ok) {
      setError(result.error ?? "校验失败");
      onValidationChange?.(result.error ?? "校验失败");
      return;
    }
    setError(null);
    onValidationChange?.(null);
    onChange(result.value ?? {});
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="input-schema">input_schema (JSON)</Label>
      <Textarea
        id="input-schema"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        readOnly={readOnly}
        className="min-h-[160px] font-mono text-sm"
      />
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  );
}
