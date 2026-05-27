"use client";

import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ApiResponse } from "@/types/api";

interface AuditLogRow {
  id: string;
  actor_id: string | null;
  target_id: string | null;
  action: string;
  diff: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export function AuditLogsPanel() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/audit");
      const payload = (await res.json()) as ApiResponse<{ logs: AuditLogRow[] }>;
      if (payload.ok) {
        setLogs(payload.data.logs);
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          审计日志
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          默认保留 180 天，可在数据库 app_settings 中调整
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">最近操作</CardTitle>
          <CardDescription>展示最近 100 条记录</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">时间</TableHead>
                <TableHead>动作</TableHead>
                <TableHead>操作者</TableHead>
                <TableHead>目标</TableHead>
                <TableHead className="pr-6">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-muted-foreground"
                  >
                    暂无审计记录
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="pl-6 whitespace-nowrap text-xs">
                      {new Date(log.created_at).toLocaleString("zh-CN")}
                    </TableCell>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell className="max-w-[120px] truncate font-mono text-xs text-muted-foreground">
                      {log.actor_id ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[120px] truncate font-mono text-xs text-muted-foreground">
                      {log.target_id ?? "—"}
                    </TableCell>
                    <TableCell className="pr-6 text-xs text-muted-foreground">
                      {log.ip_address ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
