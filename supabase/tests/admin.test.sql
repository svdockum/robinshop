-- Beheerfuncties: werken voor de server (service role) en beheerders, niet voor leden.
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000002a1', 'lid@test.local');
insert into households (id, name, start_month, auth_user_id) values
  ('00000000-0000-0000-0000-0000000002b1', 'Huishouden Beheertest', '2026-01-01', '00000000-0000-0000-0000-0000000002a1');

insert into auth.sessions (id, user_id) values
  ('00000000-0000-0000-0000-0000000003c1', '00000000-0000-0000-0000-0000000002a1'),
  ('00000000-0000-0000-0000-0000000003c2', '00000000-0000-0000-0000-0000000002a1');

set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select ok((admin_stats() ? 'households'), 'server (service role) kan admin_stats gebruiken');
select is(revoke_household_sessions('00000000-0000-0000-0000-0000000002b1'), 2, 'nieuwe pascode: alle sessies van het huishouden worden ingetrokken');
reset role;
select is((select count(*)::int from auth.sessions where user_id = '00000000-0000-0000-0000-0000000002a1'), 0, 'er zijn geen sessies meer over');
set local role service_role;
select ok(jsonb_array_length(admin_households()) >= 1, 'server (service role) kan admin_households gebruiken');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000002a1","role":"authenticated"}', true);
select throws_ok('select admin_stats()', '42501', null, 'lid kan admin_stats niet gebruiken');
select throws_ok('select admin_households()', '42501', null, 'lid kan admin_households niet gebruiken');
select throws_ok($$select revoke_household_sessions('00000000-0000-0000-0000-0000000002b1')$$, '42501', null, 'lid kan geen sessies intrekken');

select * from finish();
rollback;
