create table if not exists public.fund_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  account_type text not null check (account_type in ('risk_reserve', 'quality_fund', 'client_refund', 'firm_retained')),
  settlement_id uuid references public.settlements(id) on delete set null,
  risk_case_id uuid references public.risk_cases(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  amount_cents bigint not null check (amount_cents >= 0),
  direction text not null default 'inflow' check (direction in ('inflow', 'outflow')),
  transaction_type text not null default 'risk_deduction'
    check (transaction_type in ('risk_deduction', 'manual_adjustment', 'client_refund')),
  status text not null default 'posted' check (status in ('posted', 'void')),
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_fund_transactions_org_created
  on public.fund_transactions (organization_id, created_at desc);

create index if not exists idx_fund_transactions_org_account
  on public.fund_transactions (organization_id, account_type, created_at desc);

create index if not exists idx_fund_transactions_settlement
  on public.fund_transactions (organization_id, settlement_id)
  where settlement_id is not null;

create unique index if not exists idx_fund_transactions_unique_risk_deduction
  on public.fund_transactions (organization_id, settlement_id, transaction_type)
  where transaction_type = 'risk_deduction' and status = 'posted' and settlement_id is not null;

alter table public.fund_transactions enable row level security;

revoke all on public.fund_transactions from anon;
revoke all on public.fund_transactions from authenticated;
grant select, insert, update, delete on public.fund_transactions to service_role;

create or replace function public.record_settlement_risk_deduction_fund_transaction()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if
    new.risk_deduction_locked_at is not null
    and coalesce(new.risk_deduction_amount_cents, 0) > 0
    and new.risk_penalty_destination is not null
    and (
      old.risk_deduction_locked_at is null
      or old.risk_deduction_locked_at is distinct from new.risk_deduction_locked_at
    )
  then
    insert into public.fund_transactions (
      organization_id,
      account_type,
      settlement_id,
      risk_case_id,
      task_id,
      amount_cents,
      direction,
      transaction_type,
      status,
      note,
      created_by,
      created_at
    )
    values (
      new.organization_id,
      new.risk_penalty_destination,
      new.id,
      new.risk_deduction_case_id,
      new.task_id,
      new.risk_deduction_amount_cents,
      'inflow',
      'risk_deduction',
      'posted',
      new.risk_deduction_note,
      new.risk_deduction_locked_by,
      new.risk_deduction_locked_at
    )
    on conflict do nothing;
  end if;

  return new;
end;
$$;

revoke all on function public.record_settlement_risk_deduction_fund_transaction() from public;
revoke all on function public.record_settlement_risk_deduction_fund_transaction() from anon;
revoke all on function public.record_settlement_risk_deduction_fund_transaction() from authenticated;
grant execute on function public.record_settlement_risk_deduction_fund_transaction() to service_role;

drop trigger if exists trg_record_settlement_risk_deduction_fund_transaction on public.settlements;

create trigger trg_record_settlement_risk_deduction_fund_transaction
after update of risk_deduction_locked_at, risk_deduction_amount_cents, risk_penalty_destination
on public.settlements
for each row
execute function public.record_settlement_risk_deduction_fund_transaction();

insert into public.fund_transactions (
  organization_id,
  account_type,
  settlement_id,
  risk_case_id,
  task_id,
  amount_cents,
  direction,
  transaction_type,
  status,
  note,
  created_by,
  created_at
)
select
  organization_id,
  risk_penalty_destination,
  id,
  risk_deduction_case_id,
  task_id,
  risk_deduction_amount_cents,
  'inflow',
  'risk_deduction',
  'posted',
  risk_deduction_note,
  risk_deduction_locked_by,
  risk_deduction_locked_at
from public.settlements
where
  risk_deduction_locked_at is not null
  and risk_penalty_destination is not null
  and coalesce(risk_deduction_amount_cents, 0) > 0
on conflict do nothing;

notify pgrst, 'reload schema';
