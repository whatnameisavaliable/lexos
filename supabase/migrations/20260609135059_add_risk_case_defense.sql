alter table public.risk_cases
  add column if not exists defense_statement text,
  add column if not exists defended_at timestamptz;

create index if not exists idx_risk_cases_defense_pending
  on public.risk_cases (organization_id, status, created_at)
  where defended_at is null and status <> 'resolved';
