import pg from "pg";
import {
  buildSearchSnippet,
  decodeDriveSearchCursor,
  encodeDriveSearchCursor,
  type DriveSearchParams,
  type DriveSearchResult,
} from "./drive-search.types.js";

/** 检索 SQL 片段（供测试断言未使用 `simple` tsvector）。 */
export const DRIVE_SEARCH_SQL_MARKER = "similarity(";

/**
 * 转写文稿全文检索（`pg_trgm` · `database.md` §7.3.2）。
 */
export class DriveSearchRepository {
  private readonly pool: pg.Pool;

  /**
   * @param connectionString - `SUPABASE_DB_URL`
   */
  constructor(connectionString: string) {
    this.pool = new pg.Pool({
      connectionString,
      max: 4,
      connectionTimeoutMillis: 5_000,
    });
  }

  /**
   * 在本人任务文稿中检索关键词（显式 `userId` 过滤；仅 pg_trgm，不用 simple tsvector）。
   */
  async searchTranscripts(
    userId: string,
    params: DriveSearchParams,
  ): Promise<DriveSearchResult> {
    const limit = params.limit + 1;
    const values: unknown[] = [userId, params.q, limit];
    let cursorClause = "";

    if (params.cursor) {
      const { score, taskId } = decodeDriveSearchCursor(params.cursor);
      values.push(score, taskId);
      cursorClause = `
        AND (
          score < $4
          OR (score = $4 AND t.id::text > $5)
        )`;
    }

    const sql = `
      WITH ranked AS (
        SELECT
          t.id AS task_id,
          t.title AS task_title,
          t.archive_folder_id,
          CASE
            WHEN tt.polished_text IS NOT NULL
              AND (tt.polished_text % $2 OR tt.polished_text ILIKE '%' || $2 || '%')
            THEN 'polished_text'
            ELSE 'summary_text'
          END AS matched_field,
          COALESCE(tt.polished_text, '') AS polished_text,
          COALESCE(tt.summary_text, '') AS summary_text,
          GREATEST(
            similarity(COALESCE(tt.polished_text, ''), $2),
            similarity(COALESCE(tt.summary_text, ''), $2)
          ) AS score
        FROM public.transcription_tasks t
        INNER JOIN public.transcription_transcripts tt ON tt.task_id = t.id
        WHERE t.created_by = $1::uuid
          AND t.deleted_at IS NULL
          AND (
            tt.polished_text % $2
            OR tt.summary_text % $2
            OR tt.polished_text ILIKE '%' || $2 || '%'
            OR tt.summary_text ILIKE '%' || $2 || '%'
          )
      )
      SELECT task_id, task_title, archive_folder_id, matched_field, polished_text, summary_text, score
      FROM ranked
      WHERE score > 0
      ${cursorClause}
      ORDER BY score DESC, task_id ASC
      LIMIT $3`;

    const result = await this.pool.query<{
      task_id: string;
      task_title: string;
      archive_folder_id: string | null;
      matched_field: "polished_text" | "summary_text";
      polished_text: string;
      summary_text: string;
      score: number;
    }>(sql, values);

    const rows = result.rows;
    const hasMore = rows.length > params.limit;
    const pageRows = hasMore ? rows.slice(0, params.limit) : rows;
    const last = pageRows.at(-1);

    return {
      items: pageRows.map((row) => {
        const source =
          row.matched_field === "polished_text"
            ? row.polished_text
            : row.summary_text;
        return {
          taskId: row.task_id,
          taskTitle: row.task_title,
          archiveFolderId: row.archive_folder_id,
          matchedField: row.matched_field,
          snippet: buildSearchSnippet(source, params.q),
          score: Number(row.score),
        };
      }),
      nextCursor:
        hasMore && last
          ? encodeDriveSearchCursor(Number(last.score), last.task_id)
          : undefined,
    };
  }

  /** 释放连接池（测试 teardown）。 */
  async dispose(): Promise<void> {
    await this.pool.end().catch(() => undefined);
  }
}
