"use client";

import { useCallback, useEffect, useState } from "react";
import type { AiModelPublic } from "@lexos/shared";
import { deleteModel, listModels } from "@/lib/admin-ai-api";
import { toApiClientError } from "@/lib/api-client";
import { AiModelFormDialog } from "@/components/admin/ai/ai-model-form-dialog";
import { AiModelTestButton } from "@/components/admin/ai/ai-model-test-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

/** 模型凭证列表（高密度表 `ui_design.md` §6.5）。 */
export function AiModelsPanel() {
  const [items, setItems] = useState<readonly AiModelPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AiModelPublic | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listModels({ limit: "50" });
      setItems(data.items);
    } catch (err) {
      setError(toApiClientError(err).message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(model: AiModelPublic) {
    if (!window.confirm(`确定删除模型「${model.name}」？`)) return;
    try {
      await deleteModel(model.id);
      toast.success("已删除");
      void load();
    } catch (err) {
      toast.error(toApiClientError(err).message);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          新建模型
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          暂无模型凭证，请点击「新建模型」添加。
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="h-10">
              <TableHead>名称</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Model ID</TableHead>
              <TableHead className="text-center">启用</TableHead>
              <TableHead className="text-center">兜底</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((model) => (
              <TableRow key={model.id} className="h-9 text-sm">
                <TableCell>{model.name}</TableCell>
                <TableCell>{model.providerKind}</TableCell>
                <TableCell className="font-mono text-xs">{model.modelId}</TableCell>
                <TableCell className="text-center">
                  {model.isEnabled ? (
                    <Badge variant="secondary">是</Badge>
                  ) : (
                    <Badge variant="outline">否</Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {model.isDefaultFallback ? "是" : "—"}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <AiModelTestButton modelId={model.id} />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(model);
                      setFormOpen(true);
                    }}
                  >
                    编辑
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => void handleDelete(model)}
                  >
                    删除
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AiModelFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        model={editing}
        onSaved={() => void load()}
      />
    </div>
  );
}
