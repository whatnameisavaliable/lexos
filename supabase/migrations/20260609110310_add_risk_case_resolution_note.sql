alter table public.risk_cases
  add column if not exists resolution_note text;

create index if not exists idx_risk_cases_owner_status
  on public.risk_cases (organization_id, owner_user_id, status);
