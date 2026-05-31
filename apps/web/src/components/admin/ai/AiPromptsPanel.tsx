"use client";

import { useCallback, useEffect, useState } from "react";
import type { AiPromptData } from "@/lib/admin-ai-api";
import { listPrompts } from "@/lib/admin-ai-api";
import { toApiClientError } from "@/lib/api-client";
import { AiPromptEditorDialog } from "@/components/admin/ai/ai-prompt-editor-dialog";
import { DeletePromptAlertDialog } from "@/components/admin/ai/delete-prompt-alert-dialog";
import { toast } from "sonner";
import { AI_FEATURE_LABELS } from "@/components/admin/ai/feature-labels";
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

/** Prompt 模板列表。 */
export function AiPromptsPanel() {
  const [items, setItems] = useState<readonly AiPromptData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AiPromptData | null>(null);
  const [deleting, setDeleting] = useState<AiPromptData | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPrompts();
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

  if (loading) return <Skeleton className="h-48 w-full" />;
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
            setEditorOpen(true);
          }}
        >
          新建 Prompt
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          暂无 Prompt 模板。
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="h-10">
              <TableHead>功能点</TableHead>
              <TableHead>名称</TableHead>
              <TableHead className="text-right">版本</TableHead>
              <TableHead className="text-center">已发布</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((prompt) => (
              <TableRow key={prompt.id} className="h-9 text-sm">
                <TableCell>{AI_FEATURE_LABELS[prompt.featureKey]}</TableCell>
                <TableCell>{prompt.name}</TableCell>
                <TableCell className="text-right">{prompt.version}</TableCell>
                <TableCell className="text-center">
                  {prompt.isPublished ? (
                    <Badge>已发布</Badge>
                  ) : (
                    <Badge variant="outline">草稿</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(prompt);
                      setEditorOpen(true);
                    }}
                  >
                    {prompt.isPublished ? "查看" : "编辑"}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setDeleting(prompt);
                      setDeleteOpen(true);
                    }}
                  >
                    删除
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AiPromptEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        prompt={editing}
        onSaved={() => void load()}
      />

      <DeletePromptAlertDialog
        prompt={deleting}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDone={() => {
          toast.success("Prompt 已删除");
          void load();
        }}
      />
    </div>
  );
}
