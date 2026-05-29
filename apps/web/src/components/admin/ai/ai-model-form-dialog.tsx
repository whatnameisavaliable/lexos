"use client";

import { useEffect, useState } from "react";
import type { AiModelPublic, AiProviderKind } from "@lexos/shared";
import { AI_PROVIDER_KIND_VALUES } from "@lexos/shared";
import { createModel, updateModel } from "@/lib/admin-ai-api";
import { toApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface AiModelFormDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly model?: AiModelPublic | null;
  readonly onSaved: () => void;
}

/** 创建/编辑模型凭证；`apiKey` 仅创建或勾选轮换时展示。 */
export function AiModelFormDialog({
  open,
  onOpenChange,
  model,
  onSaved,
}: AiModelFormDialogProps) {
  const isEdit = Boolean(model);
  const [name, setName] = useState("");
  const [providerKind, setProviderKind] = useState<AiProviderKind>("openai_compatible");
  const [modelName, setModelName] = useState("");
  const [modelId, setModelId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [rotateKey, setRotateKey] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [isDefaultFallback, setIsDefaultFallback] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(model?.name ?? "");
    setProviderKind(model?.providerKind ?? "openai_compatible");
    setModelName(model?.modelName ?? "");
    setModelId(model?.modelId ?? "");
    setApiKey("");
    setRotateKey(false);
    setBaseUrl(model?.baseUrl ?? "");
    setIsEnabled(model?.isEnabled ?? true);
    setIsDefaultFallback(model?.isDefaultFallback ?? false);
  }, [open, model]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (isEdit && model) {
        await updateModel(model.id, {
          name,
          providerKind,
          modelName,
          modelId,
          ...(rotateKey && apiKey ? { apiKey } : {}),
          baseUrl: baseUrl || null,
          isEnabled,
          isDefaultFallback,
        });
        toast.success("模型已更新");
      } else {
        await createModel({
          name,
          providerKind,
          modelName,
          modelId,
          apiKey,
          baseUrl: baseUrl || undefined,
          isEnabled,
          isDefaultFallback,
        });
        toast.success("模型已创建");
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(toApiClientError(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  const showApiKey = !isEdit || rotateKey;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑模型" : "新建模型"}</DialogTitle>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={(e) => void handleSubmit(e)}>
          <div className="grid gap-2">
            <Label htmlFor="ai-name">名称</Label>
            <Input id="ai-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label>提供商</Label>
            <Select value={providerKind} onValueChange={(v) => setProviderKind(v as AiProviderKind)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_PROVIDER_KIND_VALUES.map((kind) => (
                  <SelectItem key={kind} value={kind}>
                    {kind}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ai-model-name">模型名</Label>
            <Input id="ai-model-name" value={modelName} onChange={(e) => setModelName(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ai-model-id">模型 ID</Label>
            <Input id="ai-model-id" value={modelId} onChange={(e) => setModelId(e.target.value)} required />
          </div>
          {isEdit ? (
            <div className="flex items-center gap-2">
              <Switch checked={rotateKey} onCheckedChange={setRotateKey} id="rotate-key" />
              <Label htmlFor="rotate-key">轮换 API Key</Label>
            </div>
          ) : null}
          {showApiKey ? (
            <div className="grid gap-2">
              <Label htmlFor="ai-api-key">API Key</Label>
              <Input
                id="ai-api-key"
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required={!isEdit}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">当前密钥：{model?.apiKeyMasked}</p>
          )}
          <div className="grid gap-2">
            <Label htmlFor="ai-base-url">Base URL（可选）</Label>
            <Input id="ai-base-url" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={isEnabled} onCheckedChange={setIsEnabled} id="ai-enabled" />
              <Label htmlFor="ai-enabled">启用</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isDefaultFallback} onCheckedChange={setIsDefaultFallback} id="ai-fallback" />
              <Label htmlFor="ai-fallback">全局兜底</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "保存中…" : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
