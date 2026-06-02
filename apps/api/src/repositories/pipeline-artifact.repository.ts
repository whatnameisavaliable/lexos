import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  ArtifactContentType,
  PipelineArtifactStatus,
} from "@lexos/shared";
import type { SupabaseEnvConfig } from "@lexos/shared/config";

/** `pipeline_artifacts` 行（API 层）。 */
export interface PipelineArtifactRecord {
  readonly id: string;
  readonly pipelineId: string;
  readonly stepCode: string;
  readonly contentType: ArtifactContentType;
  readonly contentRaw: string;
  readonly version: number;
  readonly status: PipelineArtifactStatus;
  readonly linkedDriveNodeId: string | null;
  readonly finalizedSnapshotRaw: string | null;
  readonly updatedBy: string | null;
  readonly updatedAt: string;
}

interface PipelineArtifactRowDb {
  readonly id: string;
  readonly pipeline_id: string;
  readonly step_code: string;
  readonly content_type: ArtifactContentType;
  readonly content_raw: string;
  readonly version: number;
  readonly status: PipelineArtifactStatus;
  readonly linked_drive_node_id: string | null;
  readonly finalized_snapshot_raw: string | null;
  readonly updated_by: string | null;
  readonly updated_at: string;
}

const PIPELINE_ARTIFACT_SELECT =
  "id, pipeline_id, step_code, content_type, content_raw, version, status, linked_drive_node_id, finalized_snapshot_raw, updated_by, updated_at";

/** `upsertArtifactForStep` 入参。 */
export interface UpsertArtifactForStepInput {
  readonly pipelineId: string;
  readonly stepCode: string;
  readonly contentType: ArtifactContentType;
  readonly status: PipelineArtifactStatus;
  readonly contentRaw?: string;
  readonly updatedBy?: string;
}

/**
 * 流水线产出物仓储（律师 JWT + RLS；`database.md` §3.16.5）。
 */
export class PipelineArtifactRepository {
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;

  constructor(supabaseEnv: SupabaseEnvConfig) {
    this.supabaseUrl = supabaseEnv.supabaseUrl;
    this.supabaseAnonKey = supabaseEnv.supabaseAnonKey;
  }

  /**
   * 按流水线与步骤 upsert 产出物（`UNIQUE (pipeline_id, step_code)`）。
   */
  async upsertArtifactForStep(
    accessToken: string,
    input: UpsertArtifactForStepInput,
  ): Promise<PipelineArtifactRecord> {
    const client = this.userClient(accessToken);
    const row: Record<string, unknown> = {
      pipeline_id: input.pipelineId,
      step_code: input.stepCode,
      content_type: input.contentType,
      status: input.status,
      content_raw: input.contentRaw ?? "",
    };
    if (input.updatedBy) {
      row.updated_by = input.updatedBy;
    }

    const { data, error } = await client
      .from("pipeline_artifacts")
      .upsert(row, { onConflict: "pipeline_id,step_code" })
      .select(PIPELINE_ARTIFACT_SELECT)
      .single();

    if (error) {
      throw new Error(
        `pipeline_artifacts.upsertArtifactForStep failed: ${error.message}`,
      );
    }
    return mapPipelineArtifactRow(data as PipelineArtifactRowDb);
  }

  /**
   * 按流水线 ID 与步骤 code 查询产出物。
   */
  async findArtifactByStep(
    accessToken: string,
    pipelineId: string,
    stepCode: string,
  ): Promise<PipelineArtifactRecord | null> {
    const client = this.userClient(accessToken);
    const { data, error } = await client
      .from("pipeline_artifacts")
      .select(PIPELINE_ARTIFACT_SELECT)
      .eq("pipeline_id", pipelineId)
      .eq("step_code", stepCode)
      .maybeSingle();

    if (error) {
      throw new Error(
        `pipeline_artifacts.findArtifactByStep failed: ${error.message}`,
      );
    }
    return data ? mapPipelineArtifactRow(data as PipelineArtifactRowDb) : null;
  }

  /**
   * 按产出物 ID 查询。
   */
  async findArtifactById(
    accessToken: string,
    artifactId: string,
  ): Promise<PipelineArtifactRecord | null> {
    const client = this.userClient(accessToken);
    const { data, error } = await client
      .from("pipeline_artifacts")
      .select(PIPELINE_ARTIFACT_SELECT)
      .eq("id", artifactId)
      .maybeSingle();

    if (error) {
      throw new Error(
        `pipeline_artifacts.findArtifactById failed: ${error.message}`,
      );
    }
    return data ? mapPipelineArtifactRow(data as PipelineArtifactRowDb) : null;
  }

  /**
   * 乐观锁更新正文（`If-Match: version`）；版本不匹配时返回 `null`。
   */
  async patchContentRaw(
    accessToken: string,
    artifactId: string,
    expectedVersion: number,
    contentRaw: string,
    updatedBy?: string,
  ): Promise<PipelineArtifactRecord | null> {
    const client = this.userClient(accessToken);
    const payload: Record<string, unknown> = {
      content_raw: contentRaw,
      version: expectedVersion + 1,
    };
    if (updatedBy) {
      payload.updated_by = updatedBy;
    }

    const { data, error } = await client
      .from("pipeline_artifacts")
      .update(payload)
      .eq("id", artifactId)
      .eq("version", expectedVersion)
      .select(PIPELINE_ARTIFACT_SELECT)
      .maybeSingle();

    if (error) {
      throw new Error(
        `pipeline_artifacts.patchContentRaw failed: ${error.message}`,
      );
    }
    return data ? mapPipelineArtifactRow(data as PipelineArtifactRowDb) : null;
  }

  /**
   * 更新产出物状态。
   */
  async setArtifactStatus(
    accessToken: string,
    artifactId: string,
    status: PipelineArtifactStatus,
    updatedBy?: string,
  ): Promise<PipelineArtifactRecord | null> {
    const client = this.userClient(accessToken);
    const payload: Record<string, unknown> = { status };
    if (updatedBy) {
      payload.updated_by = updatedBy;
    }

    const { data, error } = await client
      .from("pipeline_artifacts")
      .update(payload)
      .eq("id", artifactId)
      .select(PIPELINE_ARTIFACT_SELECT)
      .maybeSingle();

    if (error) {
      throw new Error(
        `pipeline_artifacts.setArtifactStatus failed: ${error.message}`,
      );
    }
    return data ? mapPipelineArtifactRow(data as PipelineArtifactRowDb) : null;
  }

  /**
   * 写入定稿快照并置 `finalized`。
   */
  async setFinalizedSnapshot(
    accessToken: string,
    artifactId: string,
    snapshotRaw: string,
    updatedBy?: string,
  ): Promise<PipelineArtifactRecord | null> {
    const client = this.userClient(accessToken);
    const payload: Record<string, unknown> = {
      finalized_snapshot_raw: snapshotRaw,
      status: "finalized",
    };
    if (updatedBy) {
      payload.updated_by = updatedBy;
    }

    const { data, error } = await client
      .from("pipeline_artifacts")
      .update(payload)
      .eq("id", artifactId)
      .select(PIPELINE_ARTIFACT_SELECT)
      .maybeSingle();

    if (error) {
      throw new Error(
        `pipeline_artifacts.setFinalizedSnapshot failed: ${error.message}`,
      );
    }
    return data ? mapPipelineArtifactRow(data as PipelineArtifactRowDb) : null;
  }

  private userClient(accessToken: string): SupabaseClient {
    return createClient(this.supabaseUrl, this.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  }
}

function mapPipelineArtifactRow(row: PipelineArtifactRowDb): PipelineArtifactRecord {
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
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}
