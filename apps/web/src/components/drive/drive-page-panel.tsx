"use client";

import { useCallback, useEffect, useState } from "react";
import type { DriveNodeSummary } from "@lexos/shared";
import {
  downloadDriveFile,
  getDriveNode,
  getDriveRoot,
  listDriveNodes,
} from "@/lib/drive-api";
import { toApiClientError } from "@/lib/api-client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DriveBreadcrumbNav, type DriveBreadcrumbSegment } from "./drive-breadcrumb-nav";
import { DriveNodesTable } from "./drive-nodes-table";
import { CreateFolderDialog } from "./create-folder-dialog";
import { DriveSearchPanel } from "./drive-search-panel";

const PAGE_LIMIT = 50;

/** 个人云盘主页（`ui_design.md` §6.4）。 */
export function DrivePagePanel() {
  const [rootId, setRootId] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [segments, setSegments] = useState<readonly DriveBreadcrumbSegment[]>(
    [],
  );
  const [items, setItems] = useState<readonly DriveNodeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  const rebuildBreadcrumb = useCallback(
    async (folderId: string, root: string) => {
      const chain: DriveBreadcrumbSegment[] = [];
      let currentId: string | null = folderId;

      while (currentId && currentId !== root) {
        const node = await getDriveNode(currentId);
        chain.unshift({ id: node.id, name: node.name });
        currentId = node.parentId;
      }

      chain.unshift({ id: root, name: "我的云盘" });
      setSegments(chain);
    },
    [],
  );

  const loadFolder = useCallback(
    async (folderId: string, root: string, cursor?: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await listDriveNodes({
          parentId: folderId,
          limit: PAGE_LIMIT,
          cursor,
        });
        setItems(cursor ? (prev) => [...prev, ...data.items] : data.items);
        setNextCursor(data.meta.nextCursor);
        setCurrentFolderId(folderId);
        await rebuildBreadcrumb(folderId, root);
      } catch (err) {
        setError(toApiClientError(err).message);
        if (!cursor) {
          setItems([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [rebuildBreadcrumb],
  );

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const root = await getDriveRoot();
      setRootId(root.rootId);
      await loadFolder(root.rootId, root.rootId);
    } catch (err) {
      setError(toApiClientError(err).message);
    } finally {
      setLoading(false);
    }
  }, [loadFolder]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  function handleNavigate(folderId: string) {
    if (!rootId) {
      return;
    }
    void loadFolder(folderId, rootId);
  }

  function handleOpenFolder(node: DriveNodeSummary) {
    if (!rootId) {
      return;
    }
    void loadFolder(node.id, rootId);
  }

  async function handleDownloadFile(node: DriveNodeSummary) {
    try {
      const signed = await downloadDriveFile(node.id);
      window.open(signed.signedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(toApiClientError(err).message);
    }
  }

  function handleRefresh() {
    if (!rootId || !currentFolderId) {
      void bootstrap();
      return;
    }
    void loadFolder(currentFolderId, rootId);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">个人云盘</h1>
        {currentFolderId ? (
          <CreateFolderDialog
            parentId={currentFolderId}
            onCreated={handleRefresh}
          />
        ) : null}
      </div>

      <DriveSearchPanel onOpenFolder={handleNavigate} />

      {segments.length > 0 ? (
        <DriveBreadcrumbNav segments={segments} onNavigate={handleNavigate} />
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-wrap items-center gap-2">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => void bootstrap()}>
              重试
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {loading && items.length === 0 ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : null}

      {!loading && items.length === 0 && !error ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">当前文件夹为空</p>
          {currentFolderId ? (
            <CreateFolderDialog
              parentId={currentFolderId}
              onCreated={handleRefresh}
            />
          ) : null}
        </div>
      ) : null}

      {items.length > 0 && currentFolderId ? (
        <>
          <DriveNodesTable
            items={items}
            onOpenFolder={handleOpenFolder}
            onDownloadFile={(node) => void handleDownloadFile(node)}
            onRenamed={handleRefresh}
            onMoved={handleRefresh}
            onDeleted={handleRefresh}
          />
          {nextCursor ? (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => {
                  if (rootId && currentFolderId) {
                    void loadFolder(currentFolderId, rootId, nextCursor);
                  }
                }}
              >
                加载更多
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
