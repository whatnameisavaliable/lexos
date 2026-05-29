"use client";

import { useCallback, useEffect, useState } from "react";
import { AI_FEATURE_KEY_VALUES } from "@lexos/shared";
import type { AiModelPublic } from "@lexos/shared";
import { listMappings, listModels } from "@/lib/admin-ai-api";
import type { AiFeatureMappingData } from "@/lib/admin-ai-api";
import { toApiClientError } from "@/lib/api-client";
import { AiFeatureMappingRow } from "@/components/admin/ai/ai-feature-mapping-row";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** 四功能点 × 主/兜底模型映射。 */
export function AiFeatureMappingsPanel() {
  const [models, setModels] = useState<readonly AiModelPublic[]>([]);
  const [mappings, setMappings] = useState<readonly AiFeatureMappingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [modelData, mappingData] = await Promise.all([
        listModels({ limit: "50" }),
        listMappings(),
      ]);
      setModels(modelData.items);
      setMappings(mappingData.items);
    } catch (err) {
      setError(toApiClientError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (models.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">请先在「模型凭证」中创建至少一个模型。</p>
    );
  }

  const mappingByKey = new Map(mappings.map((m) => [m.featureKey, m]));

  return (
    <Table>
      <TableHeader>
        <TableRow className="h-10">
          <TableHead>功能点</TableHead>
          <TableHead>主模型</TableHead>
          <TableHead>兜底模型</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {AI_FEATURE_KEY_VALUES.map((featureKey) => (
          <AiFeatureMappingRow
            key={featureKey}
            featureKey={featureKey}
            mapping={mappingByKey.get(featureKey) ?? null}
            models={models}
            onSaved={() => void load()}
          />
        ))}
      </TableBody>
    </Table>
  );
}
