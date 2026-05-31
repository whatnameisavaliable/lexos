"use client";

import { useEffect, useState } from "react";
import type { AiModelPublic } from "@lexos/shared";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

/**
 * 新建凭证默认适配器（仅服务端路由用，不在 UI 暴露枚举）。
 * 私有化网关多为 OpenAI 兼容协议；连通性测试走 `/models` 探活。
 */
const DEFAULT_ADAPTER_KIND = "openai_compatible" as const;

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
          providerKind: DEFAULT_ADAPTER_KIND,
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
          <DialogTitle>{isEdit ? "编辑模型凭证" : "新建模型凭证"}</DialogTitle>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={(e) => void handleSubmit(e)}>
          <div className="grid gap-2">
            <Label htmlFor="ai-name">提供商 / 凭证名称</Label>
            <Input
              id="ai-name"
              placeholder="如：DeepSeek 生产、律所内网网关"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              任意填写，仅用于列表展示；协议与端点由下方 Base URL 与模型 ID 决定。
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ai-model-name">模型名称</Label>
            <Input
              id="ai-model-name"
              placeholder="如：deepseek-chat"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ai-model-id">模型 ID</Label>
            <Input
              id="ai-model-id"
              placeholder="与厂商控制台中的 model 字段一致"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              required
            />
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
            <Label htmlFor="ai-base-url">API Base URL</Label>
            <Input
              id="ai-base-url"
              placeholder="DeepSeek: https://api.deepseek.com · Gemini: https://generativelanguage.googleapis.com/v1beta/openai"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              私有化或代理时填写。Google Gemini 请用
              generativelanguage.googleapis.com/v1beta/openai，勿填 googleapis.com。
            </p>
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
