import type { PoolClient } from "pg";
import type {
  ArtifactContentType,
  PipelineArtifactStatus,
} from "@lexos/shared";

/** 流水线产出物行（Worker 读取子集）。 */
export interface WorkerPipelineArtifactRecord {
  readonly id: string;
  readonly pipelineId: string;
  readonly stepCode: string;
  readonly contentType: ArtifactContentType;
  readonly contentRaw: string;
  readonly version: number;
  readonly status: PipelineArtifactStatus;
  readonly linkedDriveNodeId: string | null;
  readonly finalizedSnapshotRaw: string | null;
}

interface WorkerPipelineArtifactRowDb {
  readonly id: string;
  readonly pipeline_id: string;
  readonly step_code: string;
  readonly content_type: ArtifactContentType;
  readonly content_raw: string;
  readonly version: number;
  readonly status: PipelineArtifactStatus;
  readonly linked_drive_node_id: string | null;
  readonly finalized_snapshot_raw: string | null;
}

const PIPELINE_ARTIFACT_SELECT = `
  id, pipeline_id, step_code, content_type, content_raw, version,
  status, linked_drive_node_id, finalized_snapshot_raw`;

/**
 * Worker 侧流水线产出物读写（`service_role` 连接上下文）。
 */
export class WorkerPipelineArtifactRepository {
  /** 按产出物 ID 查询。 */
  async findArtifactById(
    client: PoolClient,
    artifactId: string,
  ): Promise<WorkerPipelineArtifactRecord | null> {
    const result = await client.query<WorkerPipelineArtifactRowDb>(
      `SELECT ${PIPELINE_ARTIFACT_SELECT}
       FROM public.pipeline_artifacts
       WHERE id = $1::uuid`,
      [artifactId],
    );
    const row = result.rows[0];
    return row ? mapWorkerPipelineArtifactRow(row) : null;
  }

  /** 更新产出物状态。 */
  async setArtifactStatus(
    client: PoolClient,
    artifactId: string,
    status: PipelineArtifactStatus,
  ): Promise<void> {
    const result = await client.query(
      `UPDATE public.pipeline_artifacts
       SET status = $2::public.pipeline_artifact_status,
           updated_at = now()
       WHERE id = $1::uuid`,
      [artifactId, status],
    );
    if (result.rowCount !== 1) {
      throw new Error("pipeline_artifacts.setArtifactStatus failed");
    }
  }

  /** 写入产出物正文（Worker 初稿/失败回写）。 */
  async setContentRaw(
    client: PoolClient,
    artifactId: string,
    contentRaw: string,
  ): Promise<void> {
    const result = await client.query(
      `UPDATE public.pipeline_artifacts
       SET content_raw = $2,
           updated_at = now()
       WHERE id = $1::uuid`,
      [artifactId, contentRaw],
    );
    if (result.rowCount !== 1) {
      throw new Error("pipeline_artifacts.setContentRaw failed");
    }
  }

  /** 回写 PDF 归档云盘节点 ID。 */
  async setLinkedDriveNodeId(
    client: PoolClient,
    artifactId: string,
    driveNodeId: string,
  ): Promise<void> {
    const result = await client.query(
      `UPDATE public.pipeline_artifacts
       SET linked_drive_node_id = $2::uuid,
           updated_at = now()
       WHERE id = $1::uuid`,
      [artifactId, driveNodeId],
    );
    if (result.rowCount !== 1) {
      throw new Error("pipeline_artifacts.setLinkedDriveNodeId failed");
    }
  }

  /**
   * 读取 PDF 导出用 HTML：优先 `finalized_snapshot_raw`，否则 `content_raw`。
   */
  async loadFinalizedSnapshotHtml(
    client: PoolClient,
    artifactId: string,
  ): Promise<string | null> {
    const result = await client.query<{
      readonly finalized_snapshot_raw: string | null;
      readonly content_raw: string;
    }>(
      `SELECT finalized_snapshot_raw, content_raw
       FROM public.pipeline_artifacts
       WHERE id = $1::uuid`,
      [artifactId],
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    const snapshot = row.finalized_snapshot_raw?.trim();
    if (snapshot) {
      return snapshot;
    }
    return row.content_raw;
  }
}

function mapWorkerPipelineArtifactRow(
  row: WorkerPipelineArtifactRowDb,
): WorkerPipelineArtifactRecord {
  return {
    id: row.id,
    pipelineId: row.pipeline_id,
    stepCode: row.step_code,
    contentType: row.content_type,
    contentRaw: row.content_raw,
    version: row.version,
    status: row.status,
    linkedDriveNodeId: row.linked_drive_node_id,
    finalizedSnapshotRaw: row.finalized_snapshot_raw,
  };
}
