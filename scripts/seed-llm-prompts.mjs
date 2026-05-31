/**
 * 创建并发布 llm_transcript_polish / llm_legal_summary 默认 Prompt，
 * 并补齐对应功能映射（开发环境一次性脚本）。
 *
 * 用法：node scripts/seed-llm-prompts.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
config({ path: path.join(repoRoot, ".env.development"), override: true });

const DEEPSEEK_MODEL_ID = "ec957b7b-e926-4b26-9e2c-ef20876d6203";

const PROMPTS = [
  {
    featureKey: "llm_transcript_polish",
    name: "LexOS 默认·文稿润色",
    systemPrompt: `你是 LexOS 法律语音转写系统的文稿润色助手。

【任务】
用户消息是语音识别（ASR）拼接的原始转写文本，可能含错字、同音字、断句混乱、口语赘词。请输出一份可直接供律师阅读与存档的润色正文。

【要求】
1. 忠实原意：不得编造事实、当事人、金额、日期或法律结论。
2. 纠错与规范：修正明显 ASR 错误；补充必要标点；将口语整理为书面语，删除无意义的语气词。
3. 结构：按说话或话题自然分段；若原文能区分说话人，用「说话人A：」「说话人B：」等标注（无法判断时不要强行标注）。
4. 语言：与原文主语言一致（中文为主则输出简体中文）。
5. 仅输出润色后的正文，不要前言、后记、Markdown 标题或 JSON。`,
  },
  {
    featureKey: "llm_legal_summary",
    name: "LexOS 默认·法律摘要",
    systemPrompt: `你是 LexOS 法律语音转写系统的法律摘要助手。

【任务】
用户消息是已润色的会谈/咨询/庭审录音文稿。请生成一份供律师快速阅览的结构化法律摘要。

【要求】
1. 忠实原文：不得编造未出现的事实、当事人、诉请或裁判观点。
2. 若信息缺失，写「原文未提及」，不要推测。
3. 使用简体中文，条理清晰，建议包含以下小节（无内容可写「无」）：
   - 背景与当事人
   - 争议焦点 / 咨询问题
   - 关键事实与证据线索
   - 各方主要观点
   - 已形成的结论或共识
   - 待办事项与风险提示
4. 控制篇幅：一般 300～800 字；内容极少时可更短。
5. 仅输出摘要正文，不要重复全文，不要 JSON 或代码块。`,
  },
];

const admin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const { data: adminProfile, error: profileError } = await admin
  .from("profiles")
  .select("id")
  .eq("role", "admin")
  .eq("status", "enabled")
  .order("created_at", { ascending: true })
  .limit(1)
  .maybeSingle();

if (profileError || !adminProfile?.id) {
  throw new Error(
    `Admin profile not found: ${profileError?.message ?? "empty"}`,
  );
}

const createdBy = adminProfile.id;

for (const prompt of PROMPTS) {
  const { data: existing } = await admin
    .from("ai_prompt_templates")
    .select("id, name, is_published")
    .eq("feature_key", prompt.featureKey)
    .eq("is_published", true)
    .maybeSingle();

  if (existing) {
    console.log(
      `Skip ${prompt.featureKey}: already published (${existing.name}, id=${existing.id})`,
    );
    continue;
  }

  const { data: row, error: createError } = await admin
    .from("ai_prompt_templates")
    .insert({
      feature_key: prompt.featureKey,
      name: prompt.name,
      system_prompt: prompt.systemPrompt,
      created_by: createdBy,
    })
    .select("id, feature_key, name, version, is_published")
    .single();

  if (createError) {
    throw new Error(
      `Create prompt ${prompt.featureKey} failed: ${createError.message}`,
    );
  }

  const { data: published, error: publishError } = await admin
    .from("ai_prompt_templates")
    .update({
      is_published: true,
      version: (row.version ?? 1) + 1,
    })
    .eq("id", row.id)
    .select("id, feature_key, name, version, is_published")
    .single();

  if (publishError) {
    throw new Error(
      `Publish prompt ${prompt.featureKey} failed: ${publishError.message}`,
    );
  }

  console.log(
    `Published ${published.feature_key}: 「${published.name}」 v${published.version} (${published.id})`,
  );
}

for (const featureKey of ["llm_transcript_polish", "llm_legal_summary"]) {
  const { data: mapping } = await admin
    .from("ai_feature_model_mappings")
    .select("feature_key")
    .eq("feature_key", featureKey)
    .maybeSingle();

  if (mapping) {
    console.log(`Mapping exists: ${featureKey}`);
    continue;
  }

  const { error: mapError } = await admin
    .from("ai_feature_model_mappings")
    .insert({
      feature_key: featureKey,
      primary_model_id: DEEPSEEK_MODEL_ID,
      fallback_model_id: null,
    });

  if (mapError) {
    throw new Error(`Mapping ${featureKey} failed: ${mapError.message}`);
  }
  console.log(`Created mapping ${featureKey} -> deepseek-v4-flash`);
}

console.log("Done.");
