export const AUDIT_REPORT_MAX_ROWS = 100;

export type AuditReportLog = {
  action: string;
  actionCode?: string;
  actor: string;
  createdAt: string;
  entityType: string;
  rawCreatedAt?: string;
};

export type AuditReportStat = {
  count: number;
  key: string;
  latestAt?: string;
  sharePercent: number;
};

export type AuditReportActorStat = AuditReportStat & {
  actor: string;
};

export type AuditReportDailyStat = {
  count: number;
  date: string;
};

export type AuditReportSummary = {
  actorCount: number;
  customerPortalEventCount: number;
  failedLoginCount: number;
  moduleCount: number;
  securityEventCount: number;
  topAction?: AuditReportStat;
  topActor?: AuditReportActorStat;
  topModule?: AuditReportStat;
  totalCount: number;
};

export type AuditReport = {
  actionStats: AuditReportStat[];
  actorStats: AuditReportActorStat[];
  dailyStats: AuditReportDailyStat[];
  moduleStats: AuditReportStat[];
  summary: AuditReportSummary;
};

export function buildAuditReport(logs: AuditReportLog[]): AuditReport {
  const totalCount = logs.length;
  const moduleStats = buildGroupedStats(logs, (log) => log.entityType || "system", totalCount);
  const actionStats = buildGroupedStats(logs, (log) => log.actionCode || log.action || "system.event", totalCount);
  const actorStats = buildGroupedStats(logs, (log) => log.actor || "系统", totalCount).map((stat) => ({
    ...stat,
    actor: stat.key,
  }));
  const dailyStats = buildDailyStats(logs);
  const failedLoginCount = logs.filter((log) => (log.actionCode ?? log.action) === "auth.login_failed").length;
  const customerPortalEventCount = logs.filter((log) => log.entityType === "customer_portal").length;
  const securityEventCount = logs.filter((log) => {
    const action = log.actionCode ?? log.action;

    return log.entityType === "auth" || action.startsWith("auth.");
  }).length;

  return {
    actionStats,
    actorStats,
    dailyStats,
    moduleStats,
    summary: {
      actorCount: actorStats.length,
      customerPortalEventCount,
      failedLoginCount,
      moduleCount: moduleStats.length,
      securityEventCount,
      topAction: actionStats[0],
      topActor: actorStats[0],
      topModule: moduleStats[0],
      totalCount,
    },
  };
}

function buildGroupedStats(
  logs: AuditReportLog[],
  selectKey: (log: AuditReportLog) => string,
  totalCount: number,
): AuditReportStat[] {
  const statsByKey = new Map<string, AuditReportStat>();

  logs.forEach((log) => {
    const key = selectKey(log);
    const current = statsByKey.get(key);
    const occurredAt = log.rawCreatedAt ?? log.createdAt;

    if (!current) {
      statsByKey.set(key, {
        count: 1,
        key,
        latestAt: occurredAt,
        sharePercent: 0,
      });
      return;
    }

    current.count += 1;
    current.latestAt = latestDateText(current.latestAt, occurredAt);
  });

  return Array.from(statsByKey.values())
    .map((stat) => ({
      ...stat,
      sharePercent: percentage(stat.count, totalCount),
    }))
    .sort(compareAuditReportStats);
}

function buildDailyStats(logs: AuditReportLog[]): AuditReportDailyStat[] {
  const countsByDate = new Map<string, number>();

  logs.forEach((log) => {
    const date = auditLogDateText(log);

    if (!date) {
      return;
    }

    countsByDate.set(date, (countsByDate.get(date) ?? 0) + 1);
  });

  return Array.from(countsByDate.entries())
    .map(([date, count]) => ({ count, date }))
    .sort((first, second) => first.date.localeCompare(second.date));
}

function compareAuditReportStats(first: AuditReportStat, second: AuditReportStat): number {
  if (second.count !== first.count) {
    return second.count - first.count;
  }

  const latestDiff = parseAuditDate(second.latestAt) - parseAuditDate(first.latestAt);

  if (latestDiff !== 0) {
    return latestDiff;
  }

  return first.key.localeCompare(second.key, "zh-CN");
}

function auditLogDateText(log: AuditReportLog): string | undefined {
  const value = log.rawCreatedAt ?? log.createdAt;

  return value ? value.slice(0, 10) : undefined;
}

function latestDateText(current: string | undefined, next: string | undefined): string | undefined {
  if (!current) {
    return next;
  }

  if (!next) {
    return current;
  }

  return parseAuditDate(next) > parseAuditDate(current) ? next : current;
}

function parseAuditDate(value: string | undefined): number {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value.replace(" ", "T"));

  return Number.isFinite(parsed) ? parsed : 0;
}

function percentage(count: number, total: number): number {
  if (!total) {
    return 0;
  }

  return Math.round((count / total) * 1000) / 10;
}
