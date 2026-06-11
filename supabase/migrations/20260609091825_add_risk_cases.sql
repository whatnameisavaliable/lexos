create table if not exists public.risk_cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  reported_by_user_id uuid references public.profiles(id) on delete set null,
  owner_user_id uuid references public.profiles(id) on delete set null,
  source text not null check (source in ('customer_complaint', 'low_score', 'manual')),
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved')),
  title text not null,
  description text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_risk_cases_org_status on public.risk_cases (organization_id, status, created_at desc);
create index if not exists idx_risk_cases_task on public.risk_cases (task_id);
create index if not exists idx_risk_cases_customer on public.risk_cases (customer_id);
create index if not exists idx_risk_cases_reporter on public.risk_cases (reported_by_user_id);

alter table public.risk_cases enable row level security;

revoke all on public.risk_cases from anon;
revoke all on public.risk_cases from authenticated;
grant select, insert, update, delete on public.risk_cases to service_role;
