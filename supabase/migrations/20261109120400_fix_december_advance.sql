-- Reviewfix: een voorschot in december werd vanaf februari opnieuw uitgekeerd,
-- omdat het alleen in januari van het opgebouwde tegoed werd afgetrokken.

-- Saldo-overzicht van een huishouden op moment `at` (tijdzone Europe/Amsterdam).
create or replace function public.household_balance(h uuid, at timestamptz default now())
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  local_ts timestamp := at at time zone 'Europe/Amsterdam';
  y int := extract(year from local_ts)::int;
  m int := extract(month from local_ts)::int;
  this_month date := make_date(y, m, 1);
  prev_month date := (make_date(y, m, 1) - interval '1 month')::date;
  year_start timestamptz := make_date(y, 1, 1)::timestamp at time zone 'Europe/Amsterdam';
  year_end timestamptz := make_date(y + 1, 1, 1)::timestamp at time zone 'Europe/Amsterdam';
  month_start timestamptz := this_month::timestamp at time zone 'Europe/Amsterdam';
  month_end timestamptz := (this_month + interval '1 month')::timestamp at time zone 'Europe/Amsterdam';
  hh_start date;
  j int;
  s int;
  accrued int;
  adv_this int;
  adv_prev int;
  adv_dec int;
  spent_y int;
  spent_m int;
  allowance int;
begin
  if coalesce((select auth.role()), '') in ('authenticated', 'anon')
     and not (public.is_admin() or h = public.my_household_id()) then
    raise exception 'Geen toegang tot dit huishouden' using errcode = '42501';
  end if;

  select start_month into hh_start from public.households where id = h;
  if not found then
    return null;
  end if;

  j := public.household_year_budget(h);
  s := case
    when hh_start < make_date(y, 1, 1) then 1
    when extract(year from hh_start)::int = y then extract(month from hh_start)::int
    else 13
  end;

  accrued := case when s <= m
    then (floor(j::numeric * m / 12) - floor(j::numeric * (s - 1) / 12))::int
    else 0 end;

  select amount into adv_this from public.advances where household_id = h and month = this_month;
  select amount into adv_prev from public.advances where household_id = h and month = prev_month;

  -- Een voorschot in december van vorig jaar gebruikte het januari-tegoed van dit jaar al.
  -- Dat geldt het hele jaar (niet alleen in januari), zolang januari meetelt.
  select amount into adv_dec from public.advances where household_id = h and month = make_date(y - 1, 12, 1);
  if adv_dec is not null and s <= 1 then
    accrued := accrued - adv_dec;
  end if;

  select coalesce(sum(points * quantity), 0)::int into spent_y
  from public.scans
  where household_id = h and removed_at is null
    and created_at >= year_start and created_at < year_end;

  select coalesce(sum(points * quantity), 0)::int into spent_m
  from public.scans
  where household_id = h and removed_at is null
    and created_at >= month_start and created_at < month_end;

  allowance := case when s <= m then public.month_allowance(j, m) else 0 end;

  return jsonb_build_object(
    'year_budget', j,
    'month_allowance', allowance,
    'month_budget', (case when adv_prev is not null then 0 else allowance end) + coalesce(adv_this, 0),
    'accrued', accrued,
    'advance_this_month', coalesce(adv_this, 0),
    'advance_last_month', adv_prev is not null,
    'next_month_allowance', public.month_allowance(j, case when m = 12 then 1 else m + 1 end),
    'spent_year', spent_y,
    'spent_month', spent_m,
    'available', accrued + coalesce(adv_this, 0) - spent_y,
    'can_advance', adv_this is null and adv_prev is null and s <= m
  );
end;
$$;
