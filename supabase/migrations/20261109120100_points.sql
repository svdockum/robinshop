-- Robin shop-scan: eetpuntenlogica.
-- Jaarbudget per huishouden, maandtegoed (jaar ÷ 12) dat doorschuift binnen het kalenderjaar,
-- voorschot op volgende maand, en het atomair registreren van scans.

-- Punten per persoon per jaar, volgens "Het eetpuntensysteem van Robin".
create or replace function public.points_for_age(age int)
returns int
language sql
immutable
set search_path = ''
as $$
  select case
    when age >= 13 then 7280
    when age >= 9 then 6240
    when age >= 4 then 5200
    else 0
  end
$$;

-- Tegoed van maand m (1..12), exact verdeeld zodat 12 maanden optellen tot het jaarbudget.
create or replace function public.month_allowance(budget int, m int)
returns int
language sql
immutable
set search_path = ''
as $$
  select (floor(budget::numeric * m / 12) - floor(budget::numeric * (m - 1) / 12))::int
$$;

create or replace function public.household_year_budget(h uuid)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    hh.budget_override,
    (select coalesce(sum(public.points_for_age(m.age)), 0)::int
       from public.household_members m where m.household_id = hh.id)
  )
  from public.households hh
  where hh.id = h
$$;

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

  -- Een voorschot in december gebruikte het januari-tegoed van dit jaar al.
  if adv_prev is not null and m = 1 then
    accrued := accrued - adv_prev;
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

-- Alles wat de ledenapp op het startscherm nodig heeft, in één aanroep.
create or replace function public.my_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  h uuid := public.my_household_id();
  local_ts timestamp := now() at time zone 'Europe/Amsterdam';
  month_start timestamptz := date_trunc('month', local_ts) at time zone 'Europe/Amsterdam';
  v record;
  result jsonb;
begin
  if h is null then
    return jsonb_build_object('household', null, 'is_admin', public.is_admin());
  end if;

  select id, started_at into v
  from public.visits
  where household_id = h and status = 'open' and started_at > now() - interval '4 hours'
  order by started_at desc
  limit 1;

  select jsonb_build_object(
    'is_admin', public.is_admin(),
    'household', jsonb_build_object('id', hh.id, 'name', hh.name),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object('name', m.name, 'age', m.age) order by m.age desc)
      from public.household_members m where m.household_id = h
    ), '[]'::jsonb),
    'balance', public.household_balance(h),
    'visit', case when v.id is null then null else jsonb_build_object(
      'id', v.id,
      'started_at', v.started_at,
      'items', coalesce((
        select jsonb_agg(jsonb_build_object(
          'scan_id', sc.id, 'product_id', p.id, 'code', p.code, 'name', p.name, 'portion', p.portion,
          'points', sc.points * sc.quantity, 'image_url', p.image_url, 'created_at', sc.created_at
        ) order by sc.created_at desc)
        from public.scans sc join public.products p on p.id = sc.product_id
        where sc.visit_id = v.id and sc.removed_at is null
      ), '[]'::jsonb),
      'points', coalesce((
        select sum(sc.points * sc.quantity) from public.scans sc
        where sc.visit_id = v.id and sc.removed_at is null
      ), 0)
    ) end,
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'color', c.color, 'spent_month', coalesce(t.pts, 0))
                       order by c.sort, c.name)
      from public.categories c
      left join (
        select p.category_id, sum(sc.points * sc.quantity)::int as pts
        from public.scans sc join public.products p on p.id = sc.product_id
        where sc.household_id = h and sc.removed_at is null and sc.created_at >= month_start
        group by p.category_id
      ) t on t.category_id = c.id
    ), '[]'::jsonb)
  ) into result
  from public.households hh
  where hh.id = h;

  return result;
end;
$$;

-- Registreer een gescand product voor het eigen huishouden.
create or replace function public.register_scan(p_code text, p_use_advance boolean default false)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  h uuid := public.my_household_id();
  local_ts timestamp := now() at time zone 'Europe/Amsterdam';
  v_id uuid;
  p record;
  prod jsonb;
  taken int;
  bal jsonb;
  avail int;
  next_amt int;
  advance_ok boolean;
  adv_used boolean := false;
  new_scan uuid;
begin
  if h is null then
    return jsonb_build_object('ok', false, 'error', 'NOT_MEMBER');
  end if;

  -- Eén scan tegelijk per huishouden, zodat het saldo nooit onder nul komt.
  perform 1 from public.households where id = h for update;

  select id into v_id
  from public.visits
  where household_id = h and status = 'open' and started_at > now() - interval '4 hours'
  order by started_at desc
  limit 1;
  if v_id is null then
    return jsonb_build_object('ok', false, 'error', 'NO_VISIT');
  end if;

  select pr.id, pr.code, pr.name, pr.portion, pr.points, pr.image_url, pr.max_per_visit, c.name as category
  into p
  from public.products pr
  left join public.categories c on c.id = pr.category_id
  where pr.code = upper(trim(p_code)) and pr.active;
  if p.id is null then
    return jsonb_build_object('ok', false, 'error', 'UNKNOWN_PRODUCT');
  end if;

  prod := jsonb_build_object(
    'id', p.id, 'code', p.code, 'name', p.name, 'portion', p.portion,
    'points', p.points, 'image_url', p.image_url, 'category', p.category
  );

  if p.max_per_visit is not null then
    select coalesce(sum(quantity), 0) into taken
    from public.scans
    where visit_id = v_id and product_id = p.id and removed_at is null;
    if taken >= p.max_per_visit then
      return jsonb_build_object('ok', false, 'error', 'MAX_REACHED', 'product', prod, 'max', p.max_per_visit);
    end if;
  end if;

  bal := public.household_balance(h);
  avail := (bal ->> 'available')::int;
  next_amt := (bal ->> 'next_month_allowance')::int;

  if avail < p.points then
    advance_ok := (bal ->> 'can_advance')::boolean and avail + next_amt >= p.points;
    if p_use_advance and advance_ok then
      insert into public.advances (household_id, month, amount)
      values (h, date_trunc('month', local_ts)::date, next_amt);
      adv_used := true;
    else
      return jsonb_build_object(
        'ok', false, 'error', 'INSUFFICIENT', 'product', prod, 'balance', bal,
        'can_advance', advance_ok, 'advance_amount', next_amt
      );
    end if;
  end if;

  insert into public.scans (visit_id, household_id, product_id, user_id, points, quantity)
  values (v_id, h, p.id, (select auth.uid()), p.points, 1)
  returning id into new_scan;

  return jsonb_build_object(
    'ok', true, 'scan_id', new_scan, 'product', prod,
    'balance', public.household_balance(h), 'advance_used', adv_used
  );
end;
$$;

-- Product teruggelegd: scan ongedaan maken zolang het bezoek open is.
create or replace function public.remove_scan(p_scan_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  h uuid := public.my_household_id();
  r record;
begin
  if h is null then
    return jsonb_build_object('ok', false, 'error', 'NOT_MEMBER');
  end if;

  perform 1 from public.households where id = h for update;

  select sc.id, v.status, v.started_at into r
  from public.scans sc join public.visits v on v.id = sc.visit_id
  where sc.id = p_scan_id and sc.household_id = h and sc.removed_at is null;
  if r.id is null then
    return jsonb_build_object('ok', false, 'error', 'NOT_FOUND');
  end if;
  if r.status <> 'open' or r.started_at <= now() - interval '4 hours' then
    return jsonb_build_object('ok', false, 'error', 'VISIT_CLOSED');
  end if;

  update public.scans set removed_at = now() where id = p_scan_id;
  return jsonb_build_object('ok', true, 'balance', public.household_balance(h));
end;
$$;

-- Inchecken bij het poortje (alleen via de server, na controle van de wisselende QR-code).
create or replace function public.start_visit(p_household uuid, p_scan_point uuid, p_user uuid default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  hname text;
  v_id uuid;
begin
  select name into hname from public.households where id = p_household for update;
  if hname is null then
    return jsonb_build_object('ok', false, 'error', 'NOT_MEMBER');
  end if;

  update public.visits set status = 'expired'
  where household_id = p_household and status = 'open' and started_at <= now() - interval '4 hours';

  insert into public.display_events (scan_point_id, kind, title)
  values (p_scan_point, 'welcome', 'Welkom, ' || hname || '!');

  select id into v_id from public.visits where household_id = p_household and status = 'open';
  if v_id is not null then
    return jsonb_build_object('ok', true, 'already', true, 'visit_id', v_id, 'household_name', hname);
  end if;

  insert into public.visits (household_id, user_id, entrance_id)
  values (p_household, p_user, p_scan_point)
  returning id into v_id;

  return jsonb_build_object('ok', true, 'already', false, 'visit_id', v_id, 'household_name', hname);
end;
$$;

-- Afronden bij de kassa (alleen via de server).
create or replace function public.finish_visit(p_household uuid, p_scan_point uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  hname text;
  v_id uuid;
  n_items int;
  n_points int;
begin
  select name into hname from public.households where id = p_household for update;
  if hname is null then
    return jsonb_build_object('ok', false, 'error', 'NOT_MEMBER');
  end if;

  select id into v_id
  from public.visits
  where household_id = p_household and status = 'open' and started_at > now() - interval '4 hours'
  order by started_at desc
  limit 1;
  if v_id is null then
    return jsonb_build_object('ok', false, 'error', 'NO_VISIT');
  end if;

  select coalesce(sum(quantity), 0)::int, coalesce(sum(points * quantity), 0)::int
  into n_items, n_points
  from public.scans where visit_id = v_id and removed_at is null;

  update public.visits
  set status = 'closed', ended_at = now(), checkout_id = p_scan_point
  where id = v_id;

  insert into public.display_events (scan_point_id, kind, title, detail)
  values (
    p_scan_point, 'checkout', hname,
    case when n_items = 1 then '1 product' else n_items || ' producten' end
      || ' · ' || n_points || case when n_points = 1 then ' punt' else ' punten' end
  );

  return jsonb_build_object(
    'ok', true, 'visit_id', v_id, 'household_name', hname,
    'items', n_items, 'points', n_points,
    'balance', public.household_balance(p_household)
  );
end;
$$;

-- Huishoudens met budget en saldo voor het beheer.
create or replace function public.admin_households()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Alleen voor beheerders' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', hh.id, 'name', hh.name, 'email', hh.email, 'start_month', hh.start_month,
      'budget_override', hh.budget_override, 'has_account', hh.auth_user_id is not null,
      'members', (select count(*) from public.household_members m where m.household_id = hh.id),
      'balance', public.household_balance(hh.id)
    ) order by hh.name)
    from public.households hh
  ), '[]'::jsonb);
end;
$$;

-- Cijfers voor het beheer-overzicht.
create or replace function public.admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  local_ts timestamp := now() at time zone 'Europe/Amsterdam';
  day_start timestamptz := date_trunc('day', local_ts) at time zone 'Europe/Amsterdam';
  month_start timestamptz := date_trunc('month', local_ts) at time zone 'Europe/Amsterdam';
begin
  if not public.is_admin() then
    raise exception 'Alleen voor beheerders' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'visits_today', (select count(*) from public.visits where started_at >= day_start),
    'open_visits', (select count(*) from public.visits where status = 'open' and started_at > now() - interval '4 hours'),
    'not_checked_out', (select count(*) from public.visits where status = 'expired'
                          or (status = 'open' and started_at <= now() - interval '4 hours')),
    'scans_today', (select count(*) from public.scans where created_at >= day_start and removed_at is null),
    'points_today', (select coalesce(sum(points * quantity), 0) from public.scans where created_at >= day_start and removed_at is null),
    'points_month', (select coalesce(sum(points * quantity), 0) from public.scans where created_at >= month_start and removed_at is null),
    'households', (select count(*) from public.households),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('name', c.name, 'color', c.color, 'points', coalesce(t.pts, 0)) order by c.sort, c.name)
      from public.categories c
      left join (
        select p.category_id, sum(sc.points * sc.quantity)::int as pts
        from public.scans sc join public.products p on p.id = sc.product_id
        where sc.created_at >= month_start and sc.removed_at is null
        group by p.category_id
      ) t on t.category_id = c.id
    ), '[]'::jsonb),
    'top_products', coalesce((
      select jsonb_agg(row_to_json(t)::jsonb order by t.count desc)
      from (
        select p.name, sum(sc.quantity)::int as count, sum(sc.points * sc.quantity)::int as points
        from public.scans sc join public.products p on p.id = sc.product_id
        where sc.created_at >= month_start and sc.removed_at is null
        group by p.name
        order by count desc
        limit 8
      ) t
    ), '[]'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Rechten op functies
-- ---------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated, service_role;
revoke execute on function public.start_visit(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.finish_visit(uuid, uuid) from public, anon, authenticated;
grant execute on function public.start_visit(uuid, uuid, uuid) to service_role;
grant execute on function public.finish_visit(uuid, uuid) to service_role;
