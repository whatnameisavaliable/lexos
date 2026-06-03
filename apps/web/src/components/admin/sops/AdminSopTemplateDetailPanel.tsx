"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminSopTemplate } from "@/lib/admin-sops-api";
import type { AdminSopTemplateDetail } from "@/lib/admin-sops-api.types";
import { toApiClientError } from "@/lib/api-client";
import { SopTemplateVersionsTable } from "@/components/admin/sops/sop-template-versions-table";
import { CreateSopVersionDialog } from "@/components/admin/sops/create-sop-version-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export interface AdminSopTemplateDetailPanelProps {
  readonly templateId: string;
}

/** 模板详情 — 版本时间线。 */
export function AdminSopTemplateDetailPanel({
  templateId,
}: AdminSopTemplateDetailPanelProps) {
  const [detail, setDetail] = useState<AdminSopTemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminSopTemplate(templateId);
      setDetail(data);
    } catch (err) {
      setError(toApiClientError(err).message);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasPublished = detail?.versions.some((v) => v.isPublished) ?? false;

  return (
    <div className="flex flex-col gap-4">
      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : null}

      {!loading && error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!loading && detail ? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{detail.name}</h1>
              <p className="text-muted-foreground text-sm">
                案件类型：{detail.caseType}
              </p>
            </div>
            <CreateSopVersionDialog
              templateId={detail.templateId}
              disabled={!hasPublished}
            />
          </div>
          {detail.versions.length === 0 ? (
            <p className="text-muted-foreground text-sm">暂无版本记录。</p>
          ) : (
            <SopTemplateVersionsTable versions={detail.versions} />
          )}
        </>
      ) : null}
    </div>
  );
}
