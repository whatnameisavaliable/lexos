alter table public.tasks
  add column if not exists source_review_score smallint,
  add column if not exists source_review_comment text,
  add column if not exists source_reviewed_at timestamptz,
  add column if not exists case_result_score smallint,
  add column if not exists case_result_summary text;

alter table public.tasks
  drop constraint if exists tasks_source_review_score_range,
  add constraint tasks_source_review_score_range
    check (source_review_score is null or (source_review_score between 1 and 10));

alter table public.tasks
  drop constraint if exists tasks_case_result_score_range,
  add constraint tasks_case_result_score_range
    check (case_result_score is null or (case_result_score between 1 and 10));
