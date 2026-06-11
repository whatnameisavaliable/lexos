alter table public.risk_cases
  add column if not exists committee_decision text
    check (committee_decision in ('no_fault', 'warning', 'deduction', 'escalation')),
  add column if not exists committee_decision_note text,
  add column if not exists committee_deduction_basis_points integer
    check (committee_deduction_basis_points is null or (committee_deduction_basis_points >= 0 and committee_deduction_basis_points <= 10000)),
  add column if not exists committee_decided_by uuid references public.profiles(id) on delete set null,
  add column if not exists committee_decided_at timestamptz;

create index if not exists idx_risk_cases_committee_decision
  on public.risk_cases (organization_id, committee_decided_at desc)
  where committee_decision is not null;
