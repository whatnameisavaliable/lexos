"use client";

import type { AuditLogItem } from "@lexos/shared";
import { AUDIT_ACTION_LABELS } from "@/components/admin/audit-action-labels";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const SENSITIVE_KEY = /password|secret|api[_-]?key|token|credential/i;

function maskMetadata(value: unknown, keyPath = ""): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === "string" && SENSITIVE_KEY.test(keyPath)) {
    return "***";
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => maskMetadata(item, `${keyPath}[${index}]`));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      const path = keyPath ? `${keyPath}.${key}` : key;
      out[key] = maskMetadata(nested, path);
    }
    return out;
  }
  return value;
}

export interface AuditLogDetailDrawerProps {
  readonly log: AuditLogItem | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

/** 审计详情侧栏（只读 metadata JSON）。 */
export function AuditLogDetailDrawer({
  log,
  open,
  onOpenChange,
}: AuditLogDetailDrawerProps) {
  const masked = log ? maskMetadata(log.metadata) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-4 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>审计详情</SheetTitle>
          <SheetDescription>
            {log
              ? `${AUDIT_ACTION_LABELS[log.action] ?? log.action} · ${log.id}`
              : "—"}
          </SheetDescription>
        </SheetHeader>
        {log ? (
          <div className="flex flex-1 flex-col gap-3 overflow-auto text-sm">
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
              <dt className="text-muted-foreground">服务端时间</dt>
              <dd>{new Date(log.createdAt).toLocaleString()}</dd>
              <dt className="text-muted-foreground">客户端时间</dt>
              <dd>
                {log.metadata.clientTimestamp
                  ? new Date(log.metadata.clientTimestamp).toLocaleString()
                  : "—"}
              </dd>
              <dt className="text-muted-foreground">操作者</dt>
              <dd className="font-mono text-xs">{log.actorId ?? "—"}</dd>
              <dt className="text-muted-foreground">IP</dt>
              <dd>{log.ipAddress ?? "—"}</dd>
              <dt className="text-muted-foreground">行哈希</dt>
              <dd className="break-all font-mono text-xs">{log.rowHash}</dd>
            </dl>
            <pre className="max-h-[50vh] overflow-auto rounded-md border bg-muted/30 p-3 text-xs">
              {JSON.stringify(masked, null, 2)}
            </pre>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
