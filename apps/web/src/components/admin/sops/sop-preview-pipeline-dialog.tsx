"use client";

import { useState } from "react";
import { previewAdminSopPipeline } from "@/lib/admin-sops-api";
import { toApiClientError } from "@/lib/api-client";
import { validateJsonSchemaText } from "@/lib/validate-json-schema-text";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export interface SopPreviewPipelineDialogProps {
  readonly templateVersionId: string;
  readonly stepCodes: readonly string[];
  readonly disabled?: boolean;
}

/** Prompt 沙盒预览（纯文本/Markdown，禁止图表库）。 */
export function SopPreviewPipelineDialog({
  templateVersionId,
  stepCodes,
  disabled = false,
}: SopPreviewPipelineDialogProps) {
  const [open, setOpen] = useState(false);
  const [stepCode, setStepCode] = useState(stepCodes[0] ?? "");
  const [formValuesText, setFormValuesText] = useState("{}");
  const [artifactText, setArtifactText] = useState("");
  const [mediaText, setMediaText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePreview() {
    const formParsed = validateJsonSchemaText(formValuesText);
    if (!formParsed.ok || !formParsed.value) {
      toast.error(formParsed.error ?? "formValues JSON 无效");
      return;
    }

    const formValues: Record<string, string> = {};
    for (const [key, val] of Object.entries(formParsed.value)) {
      formValues[key] = String(val);
    }

    setLoading(true);
    setResult(null);
    try {
      const response = await previewAdminSopPipeline({
        templateVersionId,
        stepCode,
        formValues,
        finalizedArtifacts: artifactText.trim()
          ? [{ stepCode: "upstream", contentRaw: artifactText }]
          : [],
        sopMediaExtractedText: mediaText,
      });
      setResult(response.content);
    } catch (err) {
      toast.error(toApiClientError(err).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          预览 Prompt
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Prompt 沙盒预览</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label>步骤</Label>
            <Select value={stepCode} onValueChange={setStepCode}>
              <SelectTrigger>
                <SelectValue placeholder="选择步骤" />
              </SelectTrigger>
              <SelectContent>
                {stepCodes.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="preview-form-values">模拟 formValues (JSON)</Label>
            <Textarea
              id="preview-form-values"
              value={formValuesText}
              onChange={(e) => setFormValuesText(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="preview-artifact">上游 artifact 文本（可选）</Label>
            <Textarea
              id="preview-artifact"
              value={artifactText}
              onChange={(e) => setArtifactText(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="preview-media">卷宗 OCR 文本（可选）</Label>
            <Input
              id="preview-media"
              value={mediaText}
              onChange={(e) => setMediaText(e.target.value)}
            />
          </div>
          {result !== null ? (
            <ScrollArea className="max-h-64 rounded-md border p-3">
              <pre className="whitespace-pre-wrap text-sm">{result}</pre>
            </ScrollArea>
          ) : null}
        </div>
        <DialogFooter>
          <Button onClick={() => void handlePreview()} disabled={loading || !stepCode}>
            {loading ? "预览中…" : "运行预览"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { renderPreviewResult } from "@/components/admin/sops/sop-admin-ui-utils";