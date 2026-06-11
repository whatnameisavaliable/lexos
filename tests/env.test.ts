import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildPreviewReadiness, getPreviewRuntimeMode } from "../src/lib/deployment/preview-readiness.ts";
import { normalizeSupabaseUrl } from "../src/lib/supabase/url.ts";

function previewEnv(values: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "test",
    ...values,
  } as NodeJS.ProcessEnv;
}

describe("Supabase URL", () => {
  it("兼容误填的 REST endpoint，并统一为项目根 URL", () => {
    assert.equal(
      normalizeSupabaseUrl("https://example.supabase.co/rest/v1/"),
      "https://example.supabase.co",
    );
    assert.equal(normalizeSupabaseUrl("https://example.supabase.co/"), "https://example.supabase.co");
  });
});

describe("Vercel Preview 自检", () => {
  it("显式内存 demo 模式不要求 Supabase 变量", () => {
    const env = previewEnv({ NEXT_PUBLIC_DEMO_MODE: "true" });
    const readiness = buildPreviewReadiness(env);

    assert.equal(getPreviewRuntimeMode(env), "demo");
    assert.equal(readiness.ok, true);
    assert.equal(readiness.mode, "demo");
    assert.equal(readiness.supabaseConfigured, false);
    assert.deepEqual(readiness.missingSupabaseEnvKeys, []);
  });

  it("未显式配置时按内存 demo 模式运行，并给出提示", () => {
    const readiness = buildPreviewReadiness(previewEnv());

    assert.equal(readiness.ok, true);
    assert.equal(readiness.mode, "demo");
    assert.equal(readiness.warnings.some((warning) => warning.includes("NEXT_PUBLIC_DEMO_MODE 未显式配置")), true);
  });

  it("真实 Supabase 模式缺少变量时自检不通过", () => {
    const env = previewEnv({ NEXT_PUBLIC_DEMO_MODE: "false" });
    const readiness = buildPreviewReadiness(env);

    assert.equal(getPreviewRuntimeMode(env), "supabase");
    assert.equal(readiness.ok, false);
    assert.equal(readiness.mode, "supabase");
    assert.equal(readiness.supabaseConfigured, false);
    assert.deepEqual(readiness.missingSupabaseEnvKeys, [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ]);
  });

  it("真实 Supabase 模式变量完整时自检通过", () => {
    const readiness = buildPreviewReadiness(previewEnv({
      NEXT_PUBLIC_DEMO_MODE: "false",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
    }));

    assert.equal(readiness.ok, true);
    assert.equal(readiness.mode, "supabase");
    assert.equal(readiness.supabaseConfigured, true);
    assert.deepEqual(readiness.missingSupabaseEnvKeys, []);
  });
});
