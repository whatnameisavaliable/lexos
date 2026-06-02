-- PRD-3.5: 说话人数可选、LLM 部分成功标记

ALTER TABLE public.transcription_tasks
  ADD COLUMN IF NOT EXISTS max_speakers INTEGER NULL,
  ADD COLUMN IF NOT EXISTS llm_polish_failed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS llm_summary_failed BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.transcription_tasks.max_speakers IS
  '可选说话人上限；NULL 表示不限制（PRD-3.5-02）';

COMMENT ON COLUMN public.transcription_tasks.llm_polish_failed IS
  '整篇润色失败但保留 ASR（PRD-3.5-04）';

COMMENT ON COLUMN public.transcription_tasks.llm_summary_failed IS
  '法律摘要失败但保留 ASR/润色稿（PRD-3.5-04）';
