"use client";

import { useState } from "react";
import { toast } from "sonner";
import { exportDocx, exportPdf, exportTxt } from "@/lib/transcription-api";
import { toApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ExportMenuProps {
  readonly taskId: string;
}

async function openSignedExport(
  action: () => Promise<{ signedUrl: string }>,
  label: string,
) {
  try {
    const result = await action();
    window.open(result.signedUrl, "_blank", "noopener,noreferrer");
    toast.success(`${label}导出已开始下载`);
  } catch (err) {
    toast.error(toApiClientError(err).message);
  }
}

/** 导出 Word / PDF / TXT 菜单。 */
export function ExportMenu({ taskId }: ExportMenuProps) {
  const [busy, setBusy] = useState(false);

  async function handleExport(
    label: string,
    action: () => Promise<{ signedUrl: string }>,
  ) {
    setBusy(true);
    try {
      await openSignedExport(action, label);
    } finally {
      setBusy(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={busy}>
          导出
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => void handleExport("Word", () => exportDocx(taskId))}
        >
          Word (.docx)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => void handleExport("PDF", () => exportPdf(taskId))}
        >
          PDF (.pdf)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => void handleExport("TXT", () => exportTxt(taskId))}
        >
          纯文本 (.txt)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
