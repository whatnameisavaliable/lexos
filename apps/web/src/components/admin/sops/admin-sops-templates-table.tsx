"use client";

import Link from "next/link";
import type { AdminSopTemplateListItem } from "@lexos/shared";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SopVersionStatusBadge } from "@/components/admin/sops/sop-version-status-badge";
import { adminSopTemplateDetailPath } from "@/components/admin/sops/sop-version-editor-utils";

/** 取最新版本摘要（版本号最大）。 */
export function pickLatestVersionSummary(
  item: AdminSopTemplateListItem,
): AdminSopTemplateListItem["versions"][number] | undefined {
  if (item.versions.length === 0) {
    return undefined;
  }
  return [...item.versions].sort(
    (a, b) => b.versionNumber - a.versionNumber,
  )[0];
}

export interface AdminSopsTemplatesTableProps {
  readonly items: readonly AdminSopTemplateListItem[];
}

/** SOP 模板列表表格（`ui_design.md` §6.5）。 */
export function AdminSopsTemplatesTable({ items }: AdminSopsTemplatesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>模板名称</TableHead>
          <TableHead>案件类型</TableHead>
          <TableHead>最新版本</TableHead>
          <TableHead>状态</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const latest = pickLatestVersionSummary(item);
          return (
            <TableRow key={item.templateId}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.caseType}</TableCell>
              <TableCell>{latest?.versionNumber ?? "—"}</TableCell>
              <TableCell>
                {latest ? (
                  <SopVersionStatusBadge isPublished={latest.isPublished} />
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" asChild>
                  <Link href={adminSopTemplateDetailPath(item.templateId)}>
                    查看版本
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
