alter table public.tasks
  add column if not exists review_required boolean not null default false,
  add column if not exists review_status text not null default 'not_required',
  add column if not exists review_lawyer_id uuid references public.profiles(id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_comment text;

alter table public.tasks
  drop constraint if exists tasks_review_status_check,
  add constraint tasks_review_status_check
    check (review_status in ('not_required', 'pending', 'approved', 'changes_requested'));

create index if not exists idx_tasks_review_queue
  on public.tasks (organization_id, review_required, review_status, review_lawyer_id, submitted_at desc);
