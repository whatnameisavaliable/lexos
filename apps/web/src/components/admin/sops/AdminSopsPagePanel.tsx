"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminSopTemplateListItem } from "@lexos/shared";
import { listAdminSops } from "@/lib/admin-sops-api";
import { toApiClientError } from "@/lib/api-client";
import { AdminSopsTemplatesTable } from "@/components/admin/sops/admin-sops-templates-table";
import { CreateSopTemplateDialog } from "@/components/admin/sops/create-sop-template-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_LIMIT = "50";

/** Admin SOP 模板列表面板（`ui_design.md` §6.5）。 */
export function AdminSopsPagePanel() {
  const [items, setItems] = useState<readonly AdminSopTemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminSops({ limit: PAGE_LIMIT });
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">SOP 模板</h1>
          <p className="text-muted-foreground text-sm">
            管理 SOP 逻辑模板、步骤 DAG 与 Prompt 绑定
          </p>
        </div>
        <CreateSopTemplateDialog onCreated={() => void load()} />
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : null}

      {!loading && error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <p className="text-muted-foreground text-sm">暂无 SOP 模板，点击「新建模板」开始配置。</p>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <AdminSopsTemplatesTable items={items} />
      ) : null}
    </div>
  );
}
