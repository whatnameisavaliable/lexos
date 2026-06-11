alter table public.settlements
  add column if not exists payable_amount_cents bigint check (payable_amount_cents is null or payable_amount_cents >= 0),
  add column if not exists risk_deduction_case_id uuid references public.risk_cases(id) on delete set null,
  add column if not exists risk_deduction_basis_points integer
    check (risk_deduction_basis_points is null or (risk_deduction_basis_points >= 0 and risk_deduction_basis_points <= 10000)),
  add column if not exists risk_deduction_amount_cents bigint
    check (risk_deduction_amount_cents is null or risk_deduction_amount_cents >= 0),
  add column if not exists risk_penalty_destination text
    check (risk_penalty_destination is null or risk_penalty_destination in ('risk_reserve', 'quality_fund', 'client_refund', 'firm_retained')),
  add column if not exists risk_deduction_note text,
  add column if not exists risk_deduction_locked_by uuid references public.profiles(id) on delete set null,
  add column if not exists risk_deduction_locked_at timestamptz;

update public.settlements
set
  payable_amount_cents = coalesce(payable_amount_cents, settlement_amount_cents),
  risk_deduction_basis_points = coalesce(risk_deduction_basis_points, 0),
  risk_deduction_amount_cents = coalesce(risk_deduction_amount_cents, 0)
where
  payable_amount_cents is null
  or risk_deduction_basis_points is null
  or risk_deduction_amount_cents is null;

alter table public.settlements
  alter column payable_amount_cents set default 0,
  alter column payable_amount_cents set not null,
  alter column risk_deduction_basis_points set default 0,
  alter column risk_deduction_amount_cents set default 0;

create index if not exists idx_settlements_risk_deduction_case
  on public.settlements (organization_id, risk_deduction_case_id)
  where risk_deduction_case_id is not null;

create index if not exists idx_settlements_risk_deduction_locked
  on public.settlements (organization_id, risk_deduction_locked_at desc)
  where risk_deduction_locked_at is not null;

notify pgrst, 'reload schema';
