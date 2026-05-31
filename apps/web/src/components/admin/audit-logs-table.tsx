"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuditAction, AuditLogItem } from "@lexos/shared";
import { AUDIT_ACTION_VALUES } from "@lexos/shared";
import { listAuditLogs } from "@/lib/admin-audit-api";
import { toApiClientError } from "@/lib/api-client";
import { AUDIT_ACTION_LABELS } from "@/components/admin/audit-action-labels";
import { AuditLogDetailDrawer } from "@/components/admin/audit-log-detail-drawer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

function formatAttemptedUsername(metadata: AuditLogItem["metadata"]): string {
  const raw = metadata.attempted_username;
  if (typeof raw !== "string" || raw.length === 0) {
    return "—";
  }
  if (raw.length <= 2) {
    return "*".repeat(raw.length);
  }
  return `${raw[0]}***${raw[raw.length - 1]}`;
}

/** 审计日志只读表 + 筛选（`ui_design.md` §6.5）。 */
export function AuditLogsTable() {
  const [items, setItems] = useState<readonly AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [cursor, setCursor] = useState<string | undefined>();

  const [action, setAction] = useState<string>("all");
  const [actorId, setActorId] = useState("");
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();

  const [selected, setSelected] = useState<AuditLogItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(
    async (opts?: { cursor?: string; reset?: boolean }) => {
      setLoading(true);
      setError(null);
      try {
        const from = fromDate
          ? new Date(
              fromDate.getFullYear(),
              fromDate.getMonth(),
              fromDate.getDate(),
            ).toISOString()
          : undefined;
        const to = toDate
          ? new Date(
              toDate.getFullYear(),
              toDate.getMonth(),
              toDate.getDate(),
              23,
              59,
              59,
              999,
            ).toISOString()
          : undefined;

        const data = await listAuditLogs({
          limit: 50,
          cursor: opts?.cursor,
          action: action === "all" ? undefined : (action as AuditAction),
          actorId: actorId.trim() || undefined,
          from,
          to,
        });
        setItems(data.items);
        setNextCursor(data.meta.nextCursor);
        if (opts?.reset) {
          setCursor(undefined);
        }
      } catch (err) {
        setError(toApiClientError(err).message);
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [action, actorId, fromDate, toDate],
  );

  useEffect(() => {
    void load({ cursor, reset: !cursor });
  }, [load, cursor]);

  const applyFilters = () => {
    setCursor(undefined);
    void load({ reset: true });
  };

  if (loading && items.length === 0) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        className="flex flex-wrap items-end gap-3 rounded-md border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          applyFilters();
        }}
      >
        <div className="flex flex-col gap-1">
          <Label htmlFor="audit-action">动作</Label>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger id="audit-action" className="w-[200px]">
              <SelectValue placeholder="全部" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              {AUDIT_ACTION_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {AUDIT_ACTION_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="audit-actor">操作者 ID</Label>
          <Input
            id="audit-actor"
            className="w-[280px] font-mono text-xs"
            value={actorId}
            onChange={(e) => setActorId(e.target.value)}
            placeholder="UUID（可选）"
          />
        </div>
        <DateFilterField label="起始日期" date={fromDate} onChange={setFromDate} />
        <DateFilterField label="结束日期" date={toDate} onChange={setToDate} />
        <Button type="submit" size="sm">
          筛选
        </Button>
      </form>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {items.length === 0 && !error ? (
        <p className="text-sm text-muted-foreground">暂无审计记录。</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="h-10">
              <TableHead>服务端时间</TableHead>
              <TableHead>客户端时间</TableHead>
              <TableHead>动作</TableHead>
              <TableHead>操作者</TableHead>
              <TableHead>目标</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((log) => (
              <TableRow
                key={log.id}
                className="h-9 cursor-pointer text-sm hover:bg-muted/50"
                onClick={() => {
                  setSelected(log);
                  setDrawerOpen(true);
                }}
              >
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString()}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {log.metadata.clientTimestamp
                    ? new Date(log.metadata.clientTimestamp).toLocaleString()
                    : "—"}
                </TableCell>
                <TableCell>
                  {AUDIT_ACTION_LABELS[log.action] ?? log.action}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {log.actorId ?? formatAttemptedUsername(log.metadata)}
                </TableCell>
                <TableCell className="text-xs">
                  {log.targetType ?? "—"}
                  {log.targetId ? ` / ${log.targetId.slice(0, 8)}…` : ""}
                </TableCell>
                <TableCell className="text-xs">{log.ipAddress ?? "—"}</TableCell>
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

      <AuditLogDetailDrawer
        log={selected}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}

function DateFilterField({
  label,
  date,
  onChange,
}: {
  readonly label: string;
  readonly date: Date | undefined;
  readonly onChange: (value: Date | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("w-[160px] justify-start font-normal", !date && "text-muted-foreground")}
          >
            {date ? date.toLocaleDateString() : "选择日期"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={onChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
