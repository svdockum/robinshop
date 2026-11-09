-- Row level security: leden zien alleen hun eigen huishouden; beheerders zien alles.
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000001a1', 'a@test.local'),
  ('00000000-0000-0000-0000-0000000001a2', 'b@test.local'),
  ('00000000-0000-0000-0000-0000000001a3', 'beheer@test.local');
insert into admins (user_id) values ('00000000-0000-0000-0000-0000000001a3');

insert into categories (id, name, color, sort) values ('00000000-0000-0000-0000-00000001c001', 'RLS-cat', '#115656', 99);
insert into products (id, code, name, category_id, storage, points, portion) values
  ('00000000-0000-0000-0000-00000001f001', 'RLS1', 'RLS product', '00000000-0000-0000-0000-00000001c001', 'vers', 1, '1 stuk');
insert into scan_points (id, slug, name, kind) values ('00000000-0000-0000-0000-00000001e001', 'rls-in', 'RLS ingang', 'entrance');
insert into households (id, name, start_month, auth_user_id) values
  ('00000000-0000-0000-0000-0000000001b1', 'Huishouden A', '2026-01-01', '00000000-0000-0000-0000-0000000001a1'),
  ('00000000-0000-0000-0000-0000000001b2', 'Huishouden B', '2026-01-01', '00000000-0000-0000-0000-0000000001a2');
insert into visits (id, household_id, entrance_id) values
  ('00000000-0000-0000-0000-0000000d1001', '00000000-0000-0000-0000-0000000001b1', '00000000-0000-0000-0000-00000001e001'),
  ('00000000-0000-0000-0000-0000000d1002', '00000000-0000-0000-0000-0000000001b2', '00000000-0000-0000-0000-00000001e001');
insert into scans (visit_id, household_id, product_id, points) values
  ('00000000-0000-0000-0000-0000000d1001', '00000000-0000-0000-0000-0000000001b1', '00000000-0000-0000-0000-00000001f001', 1),
  ('00000000-0000-0000-0000-0000000d1002', '00000000-0000-0000-0000-0000000001b2', '00000000-0000-0000-0000-00000001f001', 1);

-- Lid A
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000001a1","role":"authenticated"}', true);

select is((select count(*)::int from households where name like 'Huishouden %'), 1, 'lid ziet alleen het eigen huishouden');
select is((select count(*)::int from scans where household_id in ('00000000-0000-0000-0000-0000000001b1', '00000000-0000-0000-0000-0000000001b2')), 1, 'lid ziet alleen de eigen scans');
select is((select count(*)::int from visits where household_id = '00000000-0000-0000-0000-0000000001b2'), 0, 'lid ziet geen bezoeken van een ander');
select is((select count(*)::int from scan_points), 0, 'lid ziet geen scanpunten (displaysleutels)');
select ok((select count(*) from products where code = 'RLS1') = 1, 'lid ziet producten');
select throws_ok(
  $$insert into scans (visit_id, household_id, product_id, points) values ('00000000-0000-0000-0000-0000000d1001', '00000000-0000-0000-0000-0000000001b1', '00000000-0000-0000-0000-00000001f001', 1)$$,
  '42501', null, 'lid kan niet zelf scans invoegen');
select throws_ok(
  $$select start_visit('00000000-0000-0000-0000-0000000001b1', '00000000-0000-0000-0000-00000001e001')$$,
  '42501', null, 'lid kan start_visit niet aanroepen');
update households set budget_override = 999999 where id = '00000000-0000-0000-0000-0000000001b1';
select is((select budget_override from households where id = '00000000-0000-0000-0000-0000000001b1'), null::int, 'lid kan het eigen budget niet aanpassen');
select is((select is_admin()), false, 'lid is geen beheerder');

-- Beheerder
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000001a3","role":"authenticated"}', true);
select is((select count(*)::int from households where name like 'Huishouden %'), 2, 'beheerder ziet alle huishoudens');
select ok((select count(*) from scan_points where slug = 'rls-in') = 1, 'beheerder ziet scanpunten');
select is((select is_admin()), true, 'beheerder is beheerder');

select * from finish();
rollback;
