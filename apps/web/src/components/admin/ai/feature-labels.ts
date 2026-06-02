import type { AiFeatureKey } from "@lexos/shared";

/** 功能点展示名（`prd.md` §3.3）。 */
export const AI_FEATURE_LABELS: Record<AiFeatureKey, string> = {
  asr_physical: "ASR 物理切片",
  asr_semantic: "ASR 语义分段",
  llm_transcript_polish: "文稿润色",
  llm_legal_summary: "法律摘要",
  "sop.fact_extract": "SOP 事实提取",
  "sop.strategy_gen": "SOP 策略生成",
  "sop.deep_research": "SOP 深度研究",
  "sop.visual_charting": "SOP 可视化图表",
};
