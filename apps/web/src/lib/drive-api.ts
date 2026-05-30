import type {
  DriveFolderCreateBody,
  DriveNodeSummary,
  DriveNodeUpdateBody,
  DriveNodesListQuery,
  DriveSearchQuery,
} from "@lexos/shared";
import type { PaginationMeta } from "@lexos/shared/api";
import { apiFetch } from "./api-client";

/** 签名下载 URL 响应。 */
export interface SignedDownloadUrlResult {
  readonly signedUrl: string;
  readonly expiresInSec: number;
  readonly objectKey: string;
  readonly bucket: string;
}

/** 云盘根目录响应。 */
export interface DriveRootData {
  readonly rootId: string;
}

/** 云盘节点详情。 */
export interface DriveNodeDetail extends DriveNodeSummary {
  readonly parentId: string | null;
}

/** 云盘子节点列表响应。 */
export interface DriveNodesListData {
  readonly items: readonly DriveNodeSummary[];
  readonly meta: PaginationMeta;
}

/** 全文检索结果项。 */
export interface DriveSearchResultItem {
  readonly taskId: string;
  readonly taskTitle: string;
  readonly archiveFolderId: string | null;
  readonly matchedField: "polished_text" | "summary_text";
  readonly snippet: string;
  readonly score: number;
}

/** 全文检索响应。 */
export interface DriveSearchData {
  readonly items: readonly DriveSearchResultItem[];
  readonly meta: PaginationMeta;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/** `GET /api/drive/root` */
export async function getDriveRoot(): Promise<DriveRootData> {
  const res = await apiFetch<DriveRootData>("/drive/root");
  return res.data;
}

/** `GET /api/drive/nodes` */
export async function listDriveNodes(
  query: DriveNodesListQuery,
): Promise<DriveNodesListData> {
  const res = await apiFetch<DriveNodesListData>(
    `/drive/nodes${buildQuery({
      parentId: query.parentId,
      limit: query.limit,
      cursor: query.cursor,
    })}`,
  );
  return res.data;
}

/** `GET /api/drive/nodes/:id` */
export async function getDriveNode(nodeId: string): Promise<DriveNodeDetail> {
  const res = await apiFetch<DriveNodeDetail>(`/drive/nodes/${nodeId}`);
  return res.data;
}

/** `POST /api/drive/folders` */
export async function createDriveFolder(
  body: DriveFolderCreateBody,
): Promise<DriveNodeDetail> {
  const res = await apiFetch<DriveNodeDetail>("/drive/folders", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data;
}

/** `PATCH /api/drive/nodes/:id` */
export async function updateDriveNode(
  nodeId: string,
  body: DriveNodeUpdateBody,
): Promise<DriveNodeDetail> {
  const res = await apiFetch<DriveNodeDetail>(`/drive/nodes/${nodeId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return res.data;
}

/** `DELETE /api/drive/nodes/:id` */
export async function deleteDriveNode(nodeId: string): Promise<{ id: string }> {
  const res = await apiFetch<{ id: string }>(`/drive/nodes/${nodeId}`, {
    method: "DELETE",
  });
  return res.data;
}

/** `GET /api/drive/search` */
export async function searchDrive(
  query: DriveSearchQuery,
): Promise<DriveSearchData> {
  const res = await apiFetch<DriveSearchData>(
    `/drive/search${buildQuery({
      q: query.q,
      limit: query.limit,
      cursor: query.cursor,
    })}`,
  );
  return res.data;
}

/** `GET /api/drive/files/:id/download` */
export async function downloadDriveFile(
  fileId: string,
): Promise<SignedDownloadUrlResult> {
  const res = await apiFetch<SignedDownloadUrlResult>(
    `/drive/files/${fileId}/download`,
  );
  return res.data;
}
