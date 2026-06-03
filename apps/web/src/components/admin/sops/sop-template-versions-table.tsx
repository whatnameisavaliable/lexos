"use client";

import Link from "next/link";
import type { AdminSopTemplateVersionSummary } from "@lexos/shared";
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
import { adminSopVersionEditorPath } from "@/components/admin/sops/sop-version-editor-utils";

export interface SopTemplateVersionsTableProps {
  readonly versions: readonly AdminSopTemplateVersionSummary[];
}

/** 版本列表表格。 */
export function SopTemplateVersionsTable({ versions }: SopTemplateVersionsTableProps) {
  const sorted = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>版本号</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>发布时间</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((version) => (
          <TableRow key={version.versionId}>
            <TableCell>v{version.versionNumber}</TableCell>
            <TableCell>
              <SopVersionStatusBadge isPublished={version.isPublished} />
            </TableCell>
            <TableCell>{version.publishedAt ?? "—"}</TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="sm" asChild>
                <Link href={adminSopVersionEditorPath(version.versionId)}>
                  {version.isPublished ? "查看" : "编辑"}
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
