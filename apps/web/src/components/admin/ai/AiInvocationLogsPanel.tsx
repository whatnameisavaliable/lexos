"use client";

import { useCallback, useEffect, useState } from "react";
import type { AiInvocationLogData } from "@/lib/admin-ai-api";
import { listInvocationLogs } from "@/lib/admin-ai-api";
import { toApiClientError } from "@/lib/api-client";
import { AI_FEATURE_LABELS } from "@/components/admin/ai/feature-labels";
import type { AiFeatureKey } from "@lexos/shared";
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

/** 只读 AI 调用日志（分页 50）。 */
export function AiInvocationLogsPanel() {
  const [items, setItems] = useState<readonly AiInvocationLogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>();
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  const load = useCallback(async (opts?: { cursor?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listInvocationLogs({ limit: "50", cursor: opts?.cursor });
      setItems(data.items);
      setNextCursor(data.meta.nextCursor);
    } catch (err) {
      setError(toApiClientError(err).message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load({ cursor });
  }, [load, cursor]);

  if (loading && items.length === 0) {
    return <Skeleton className="h-48 w-full" />;
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
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无调用日志（Worker 写入属 M5）。</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="h-10">
              <TableHead>时间</TableHead>
              <TableHead>功能点</TableHead>
              <TableHead className="text-center">结果</TableHead>
              <TableHead className="text-right">耗时(ms)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((log) => (
              <TableRow key={log.id} className="h-9 text-sm">
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  {AI_FEATURE_LABELS[log.featureKey as AiFeatureKey] ?? log.featureKey}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={log.outcome === "success" ? "secondary" : "destructive"}>
                    {log.outcome}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{log.latencyMs}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!nextCursor || loading}
          onClick={() => setCursor(nextCursor)}
        >
          下一页
        </Button>
      </div>
    </div>
  );
}
