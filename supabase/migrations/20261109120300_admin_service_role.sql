-- Beheer (/robinadmin) loopt via de server met de service role.
-- Beheerfuncties staan daarom open voor beheerders én de service role, niet voor leden.

create or replace function public.is_admin_or_server()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select auth.role()), '') = 'service_role' or public.is_admin()
$$;

create or replace function public.admin_households()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin_or_server() then
    raise exception 'Alleen voor beheerders' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', hh.id, 'name', hh.name, 'email', hh.email, 'start_month', hh.start_month,
      'budget_override', hh.budget_override, 'has_account', hh.auth_user_id is not null,
      'card_code', hh.card_code,
      'members', (select count(*) from public.household_members m where m.household_id = hh.id),
      'balance', public.household_balance(hh.id)
    ) order by hh.name)
    from public.households hh
  ), '[]'::jsonb);
end;
$$;

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
  if not public.is_admin_or_server() then
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
    'products', (select count(*) from public.products where active),
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

revoke execute on function public.is_admin_or_server() from public, anon;
grant execute on function public.is_admin_or_server() to authenticated, service_role;
