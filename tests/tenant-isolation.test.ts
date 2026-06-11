import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildTenantIsolationReadiness,
  formatTenantIsolationReadiness,
  tenantScopedTables,
  type TenantIsolationInventory,
} from "../src/lib/operations/tenant-isolation.ts";

const migrationText = [
  ...tenantScopedTables.map((tableName) => `create table public.${tableName} (id uuid, organization_id uuid);`),
  "create table public.organizations (id uuid);",
  "create table public.profiles (id uuid);",
  "create table public.roles (code text);",
  "create table public.customer_verification_codes (id uuid, portal_link_id uuid);",
].join("\n");

const readyInventory: TenantIsolationInventory = {
  migrationFiles: ["001.sql"],
  files: {
    "supabase/migrations/001.sql": migrationText,
    "app/api/users/route.ts": "session.organizationId .eq(\"organization_id\"",
    "app/api/customers/route.ts": "session.organizationId organization_id: session.organizationId",
    "app/api/tasks/route.ts": "session.organizationId .eq(\"organization_id\"",
    "app/api/settlements/route.ts": "session.organizationId .eq(\"organization_id\"",
    "app/api/funds/route.ts": "session.organizationId .eq(\"organization_id\"",
    "app/api/risk-cases/route.ts": "session.organizationId .eq(\"organization_id\"",
    "app/api/audit-logs/route.ts": "session.organizationId .eq(\"organization_id\"",
    "app/api/system-settings/route.ts": "session.organizationId organization_id: session.organizationId",
    "app/api/customer-portal/[token]/feedback/route.ts": "link.organization_id",
    "app/api/customer-portal/[token]/deliverables/[deliverableId]/download/route.ts": "link.organization_id",
    "src/lib/deliverables/files.ts": "organizationId input.organizationId",
  },
};

describe("多律所租户隔离核对", () => {
  it("租户表、关键 API 和 Storage 路径齐全时通过", () => {
    const readiness = buildTenantIsolationReadiness({
      generatedAt: new Date("2026-06-10T12:00:00.000Z"),
      inventory: readyInventory,
    });

    assert.equal(readiness.ok, true);
    assert.equal(readiness.checks.length, 4);
  });

  it("缺少租户表 organization_id 时阻断", () => {
    const readiness = buildTenantIsolationReadiness({
      inventory: {
        ...readyInventory,
        files: {
          ...readyInventory.files,
          "supabase/migrations/001.sql": migrationText.replace("create table public.tasks (id uuid, organization_id uuid);", "create table public.tasks (id uuid);"),
        },
      },
    });

    assert.equal(readiness.ok, false);
    assert.equal(readiness.blockers.some((blocker) => blocker.includes("tasks")), true);
  });

  it("缺少关键 API 组织过滤时阻断", () => {
    const readiness = buildTenantIsolationReadiness({
      inventory: {
        ...readyInventory,
        files: {
          ...readyInventory.files,
          "app/api/tasks/route.ts": "no organization filter",
        },
      },
    });

    assert.equal(readiness.ok, false);
    assert.equal(readiness.blockers.some((blocker) => blocker.includes("app/api/tasks/route.ts")), true);
  });

  it("格式化输出包含人工核对边界", () => {
    const markdown = formatTenantIsolationReadiness(buildTenantIsolationReadiness({
      inventory: readyInventory,
    }));

    assert.match(markdown, /多律所租户隔离核对/);
    assert.match(markdown, /关键 API 组织过滤/);
    assert.match(markdown, /不连接线上 Supabase/);
  });
});
