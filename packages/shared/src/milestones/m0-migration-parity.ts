import {
  listLocalMigrationTimestamps,
  parseSyncedMigrationTimestamps,
} from "../migrations/migration-cli-parse.js";
import { resolveRepoRoot } from "../config/env.js";

/** 迁移漂移报告。 */
export interface MigrationParityReport {
  readonly localTimestamps: readonly string[];
  readonly remoteTimestamps: readonly string[];
  readonly missingOnRemote: readonly string[];
  readonly missingLocally: readonly string[];
}

/**
 * 对比本地 `supabase/migrations/*.sql` 与 `supabase migration list` 已同步时间戳。
 */
export function compareMigrationParity(
  migrationListOutput: string,
  repoRoot?: string,
): MigrationParityReport {
  const localTimestamps = listLocalMigrationTimestamps(repoRoot);
  const remoteTimestamps = parseSyncedMigrationTimestamps(migrationListOutput);

  const localSet = new Set(localTimestamps);
  const remoteSet = new Set(remoteTimestamps);

  const missingOnRemote = localTimestamps.filter((ts) => !remoteSet.has(ts));
  const missingLocally = remoteTimestamps.filter((ts) => !localSet.has(ts));

  return {
    localTimestamps,
    remoteTimestamps,
    missingOnRemote,
    missingLocally,
  };
}

/**
 * 断言无手工改库漂移：本地与远端迁移一一对应（M0-E 门禁第二项）。
 */
export function assertMigrationParity(
  migrationListOutput: string,
  repoRoot: string = resolveRepoRoot(),
): MigrationParityReport {
  const report = compareMigrationParity(migrationListOutput, repoRoot);

  if (report.missingOnRemote.length > 0 || report.missingLocally.length > 0) {
    throw new Error(
      [
        "Migration drift detected between repo and remote:",
        `missingOnRemote=${report.missingOnRemote.join(",") || "(none)"}`,
        `missingLocally=${report.missingLocally.join(",") || "(none)"}`,
      ].join(" "),
    );
  }

  if (report.localTimestamps.length === 0) {
    throw new Error("No local migration files found in supabase/migrations");
  }

  return report;
}
