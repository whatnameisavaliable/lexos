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
    const apiErr = toApiClientError(err);
    const lower = apiErr.message.toLowerCase();
    const isTransientNetwork =
      lower.includes("failed to fetch") ||
      lower.includes("econnreset") ||
      lower.includes("socket hang up") ||
      lower.includes("无法连接 bff/api");
    toast.error(
      isTransientNetwork
        ? "API 服务尚未就绪或正在重启，请等待终端出现「API listening」后重试"
        : apiErr.message,
    );
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
    const toastId = `export-${label}`;
    const loadingHint =
      label === "PDF" ? `正在生成 ${label}…（可能需要 1–2 分钟）` : `正在生成 ${label}…`;
    toast.loading(loadingHint, { id: toastId });
    try {
      await openSignedExport(action, label);
    } finally {
      toast.dismiss(toastId);
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
