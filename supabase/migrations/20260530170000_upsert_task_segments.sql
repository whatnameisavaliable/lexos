-- M5-B: Worker batch upsert for transcription_segments (database.md §4.4.2)

CREATE OR REPLACE FUNCTION public.upsert_task_segments(
  p_task_id uuid,
  p_segments jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seg jsonb;
  upserted int := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.transcription_tasks
    WHERE id = p_task_id
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'task_not_found';
  END IF;

  IF jsonb_typeof(p_segments) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'segments_must_be_array';
  END IF;

  FOR seg IN SELECT value FROM jsonb_array_elements(p_segments)
  LOOP
    IF seg->>'segment_index' IS NULL
       OR seg->>'start_ms' IS NULL
       OR seg->>'end_ms' IS NULL THEN
      RAISE EXCEPTION 'segment_missing_required_fields';
    END IF;

    INSERT INTO public.transcription_segments (
      task_id,
      segment_index,
      start_ms,
      end_ms,
      storage_key,
      local_path_hint,
      chunk_size_bytes,
      asr_text,
      speaker_label,
      status
    ) VALUES (
      p_task_id,
      (seg->>'segment_index')::integer,
      (seg->>'start_ms')::integer,
      (seg->>'end_ms')::integer,
      NULL,
      NULLIF(seg->>'local_path_hint', ''),
      NULLIF(seg->>'chunk_size_bytes', '')::bigint,
      NULLIF(seg->>'asr_text', ''),
      NULLIF(seg->>'speaker_label', ''),
      COALESCE(NULLIF(seg->>'status', ''), 'pending')
    )
    ON CONFLICT (task_id, segment_index) DO UPDATE SET
      start_ms = EXCLUDED.start_ms,
      end_ms = EXCLUDED.end_ms,
      local_path_hint = EXCLUDED.local_path_hint,
      chunk_size_bytes = EXCLUDED.chunk_size_bytes,
      asr_text = COALESCE(EXCLUDED.asr_text, public.transcription_segments.asr_text),
      speaker_label = COALESCE(EXCLUDED.speaker_label, public.transcription_segments.speaker_label),
      status = EXCLUDED.status;

    upserted := upserted + 1;
  END LOOP;

  RETURN upserted;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_task_segments(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_task_segments(uuid, jsonb) TO service_role;
