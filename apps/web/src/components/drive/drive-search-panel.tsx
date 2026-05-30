"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { parseDriveSearchQuery } from "@lexos/shared";
import { ZodError } from "zod";
import { searchDrive, type DriveSearchResultItem } from "@/lib/drive-api";
import { toApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface DriveSearchPanelProps {
  readonly onOpenFolder: (folderId: string) => void;
}

/** 全文检索面板。 */
export function DriveSearchPanel({ onOpenFolder }: DriveSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<readonly DriveSearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const parsed = parseDriveSearchQuery({ q: query, limit: 50 });
      const data = await searchDrive(parsed);
      setItems(data.items);
    } catch (err) {
      if (err instanceof ZodError) {
        setError("请输入至少 2 个字符");
      } else {
        setError(toApiClientError(err).message);
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索转写正文（至少 2 字）"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              void runSearch();
            }
          }}
        />
        <Button type="button" onClick={() => void runSearch()} disabled={loading}>
          搜索
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!loading && searched && items.length === 0 && !error ? (
        <p className="text-sm text-muted-foreground">未找到匹配结果</p>
      ) : null}

      {!loading && items.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={`${item.taskId}-${item.matchedField}`}
              className="rounded-md border p-3 text-sm"
            >
              <div className="font-medium">{item.taskTitle}</div>
              <p className="mt-1 text-muted-foreground">{item.snippet}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button variant="link" size="sm" className="h-auto px-0" asChild>
                  <Link href={`/transcription/${item.taskId}`}>打开转写</Link>
                </Button>
                {item.archiveFolderId ? (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto px-0"
                    onClick={() => onOpenFolder(item.archiveFolderId!)}
                  >
                    打开归档目录
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
