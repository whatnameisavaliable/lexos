"use client";

import { useEffect, useState } from "react";
import type { AiFeatureKey, AiModelPublic } from "@lexos/shared";
import type { AiFeatureMappingData } from "@/lib/admin-ai-api";
import { upsertMapping } from "@/lib/admin-ai-api";
import { toApiClientError } from "@/lib/api-client";
import { AI_FEATURE_LABELS } from "@/components/admin/ai/feature-labels";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

interface AiFeatureMappingRowProps {
  readonly featureKey: AiFeatureKey;
  readonly mapping: AiFeatureMappingData | null;
  readonly models: readonly AiModelPublic[];
  readonly onSaved: () => void;
}

const NONE = "__none__";

/** 单行功能映射保存。 */
export function AiFeatureMappingRow({
  featureKey,
  mapping,
  models,
  onSaved,
}: AiFeatureMappingRowProps) {
  const [primaryModelId, setPrimaryModelId] = useState(mapping?.primaryModelId ?? "");
  const [fallbackModelId, setFallbackModelId] = useState(
    mapping?.fallbackModelId ?? NONE,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPrimaryModelId(mapping?.primaryModelId ?? "");
    setFallbackModelId(mapping?.fallbackModelId ?? NONE);
  }, [mapping]);

  async function handleSave() {
    if (!primaryModelId) {
      toast.error("请选择主模型");
      return;
    }
    setSaving(true);
    try {
      await upsertMapping(featureKey, {
        primaryModelId,
        fallbackModelId: fallbackModelId === NONE ? null : fallbackModelId,
      });
      toast.success("映射已保存");
      onSaved();
    } catch (err) {
      toast.error(toApiClientError(err).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <TableRow className="h-10 text-sm">
      <TableCell className="font-medium">{AI_FEATURE_LABELS[featureKey]}</TableCell>
      <TableCell>
        <Label className="sr-only">主模型</Label>
        <Select value={primaryModelId} onValueChange={setPrimaryModelId}>
          <SelectTrigger>
            <SelectValue placeholder="选择主模型" />
          </SelectTrigger>
          <SelectContent>
            {models.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select value={fallbackModelId} onValueChange={setFallbackModelId}>
          <SelectTrigger>
            <SelectValue placeholder="无兜底" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>无</SelectItem>
            {models.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-right">
        <Button type="button" size="sm" disabled={saving} onClick={() => void handleSave()}>
          {saving ? "保存中…" : "保存"}
        </Button>
      </TableCell>
    </TableRow>
  );
}
