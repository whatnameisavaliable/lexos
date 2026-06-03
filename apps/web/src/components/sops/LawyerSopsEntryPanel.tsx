"use client";

import { useCallback, useEffect, useState } from "react";
import type { SopPublishedTemplateItem } from "@lexos/shared";
import { listSopTemplates } from "@/lib/lawyer-sops-api";
import { toApiClientError } from "@/lib/api-client";
import { SopPublishedTemplatesTable } from "@/components/sops/sop-published-templates-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

/** 律师 SOP 入口：已发布模板列表 + 新建流水线。 */
export function LawyerSopsEntryPanel() {
  const [items, setItems] = useState<readonly SopPublishedTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listSopTemplates();
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">SOP 流水线</h1>
        <p className="text-muted-foreground text-sm">
          选择已发布模板创建案件流水线，按步骤执行与定稿
        </p>
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
        <p className="text-muted-foreground text-sm">暂无已发布 SOP 模板。</p>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <SopPublishedTemplatesTable items={items} />
      ) : null}
    </div>
  );
}
