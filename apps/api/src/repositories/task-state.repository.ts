import type { PoolClient } from "pg";
import type { TranscriptionTaskStatus } from "@lexos/shared";

/**
 * 转写任务状态迁移（封装 `transition_task_status` RPC，`database.md` §4.11）。
 */
export class TaskStateRepository {
  /**
   * 在事务内执行状态迁移；返回是否成功（`false` 表示 `from` 状态不匹配）。
   */
  async transitionTaskStatus(
    client: PoolClient,
    taskId: string,
    from: TranscriptionTaskStatus,
    to: TranscriptionTaskStatus,
  ): Promise<boolean> {
    const result = await client.query<{ ok: boolean }>(
      `SELECT public.transition_task_status(
         $1::uuid,
         $2::public.transcription_task_status,
         $3::public.transcription_task_status
       ) AS ok`,
      [taskId, from, to],
    );
    return result.rows[0]?.ok === true;
  }
}
