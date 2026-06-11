insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lexos-deliverables',
  'lexos-deliverables',
  false,
  6291456,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.task_deliverables
  add column if not exists storage_bucket text,
  add column if not exists storage_path text,
  add column if not exists file_name text,
  add column if not exists file_size_bytes bigint,
  add column if not exists file_mime_type text;

create index if not exists idx_task_deliverables_storage_object
  on public.task_deliverables (storage_bucket, storage_path)
  where storage_path is not null;
