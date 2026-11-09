-- Eetpuntenlogica: budget, maandtegoed, doorschuiven, voorschot en registreren van scans.
begin;
create extension if not exists pgtap with schema extensions;
select plan(57);

-- ---------------------------------------------------------------------------
-- Punten per leeftijd en maandtegoed
-- ---------------------------------------------------------------------------
select is(points_for_age(40), 7280, '13+ krijgt 7.280 punten per jaar');
select is(points_for_age(13), 7280, '13 jaar krijgt 7.280');
select is(points_for_age(12), 6240, '12 jaar krijgt 6.240');
select is(points_for_age(9), 6240, '9 jaar krijgt 6.240');
select is(points_for_age(8), 5200, '8 jaar krijgt 5.200');
select is(points_for_age(4), 5200, '4 jaar krijgt 5.200');
select is(points_for_age(3), 0, '3 jaar krijgt 0');

select is(month_allowance(7280, 1), 606, 'januari van 7.280 = 606');
select is(month_allowance(7280, 2), 607, 'februari van 7.280 = 607');
select is((select sum(month_allowance(7280, m))::int from generate_series(1, 12) m), 7280, '12 maanden tellen op tot het jaarbudget');
select is(month_allowance(31200, 7), 2600, '31.200 per jaar = 2.600 per maand');

-- ---------------------------------------------------------------------------
-- Testdata
-- ---------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'yilmaz@test.local'),
  ('00000000-0000-0000-0000-0000000000a2', 'krap@test.local');

insert into categories (id, name, color, sort) values
  ('00000000-0000-0000-0000-00000000c001', 'Testcategorie', '#115656', 99);

insert into products (id, code, name, category_id, storage, points, portion, max_per_visit) values
  ('00000000-0000-0000-0000-00000000f001', 'T1', 'Test één', '00000000-0000-0000-0000-00000000c001', 'vers', 1, '1 stuk', null),
  ('00000000-0000-0000-0000-00000000f002', 'T2', 'Test twee', '00000000-0000-0000-0000-00000000c001', 'vers', 2, '1 stuk', null),
  ('00000000-0000-0000-0000-00000000f003', 'T3', 'Test drie', '00000000-0000-0000-0000-00000000c001', 'vers', 3, '1 stuk', null),
  ('00000000-0000-0000-0000-00000000f004', 'TMAX', 'Test max', '00000000-0000-0000-0000-00000000c001', 'vers', 1, '1 stuk', 1);

insert into scan_points (id, slug, name, kind) values
  ('00000000-0000-0000-0000-00000000e001', 'test-in', 'Testingang', 'entrance'),
  ('00000000-0000-0000-0000-00000000e002', 'test-uit', 'Testkassa', 'checkout');

-- h1: familie met 2 volwassenen, kind 12, kinderen 8 en 5 → 31.200
insert into households (id, name, start_month, auth_user_id) values
  ('00000000-0000-0000-0000-0000000000b1', 'Familie Test', '2026-01-01', '00000000-0000-0000-0000-0000000000a1');
insert into household_members (household_id, name, age) values
  ('00000000-0000-0000-0000-0000000000b1', 'Ouder 1', 40),
  ('00000000-0000-0000-0000-0000000000b1', 'Ouder 2', 38),
  ('00000000-0000-0000-0000-0000000000b1', 'Kind', 12),
  ('00000000-0000-0000-0000-0000000000b1', 'Kind', 8),
  ('00000000-0000-0000-0000-0000000000b1', 'Kind', 5);

select is(household_year_budget('00000000-0000-0000-0000-0000000000b1'), 31200, 'jaarbudget uit gezinsleden = 31.200');

-- h-override: handmatig budget wint
insert into households (id, name, start_month, budget_override) values
  ('00000000-0000-0000-0000-0000000000b9', 'Familie Override', '2026-01-01', 12000);
insert into household_members (household_id, age) values ('00000000-0000-0000-0000-0000000000b9', 40);
select is(household_year_budget('00000000-0000-0000-0000-0000000000b9'), 12000, 'handmatig jaarbudget overschrijft de berekening');

-- ---------------------------------------------------------------------------
-- Saldo met vaste datums
-- ---------------------------------------------------------------------------
-- h3: start januari, 1000 punten besteed in februari
insert into households (id, name, start_month, budget_override) values
  ('00000000-0000-0000-0000-0000000000b3', 'Familie Doorschuif', '2026-01-01', 31200);
insert into visits (id, household_id, entrance_id, started_at, ended_at, status) values
  ('00000000-0000-0000-0000-0000000d0003', '00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-00000000e001', '2026-02-10 10:00+01', '2026-02-10 10:30+01', 'closed');
insert into scans (visit_id, household_id, product_id, points, quantity, created_at) values
  ('00000000-0000-0000-0000-0000000d0003', '00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-00000000f001', 1000, 1, '2026-02-10 10:05+01'),
  -- 31 dec 23:30 UTC = 1 jan 00:30 Amsterdam: telt in 2027
  ('00000000-0000-0000-0000-0000000d0003', '00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-00000000f001', 5, 1, '2026-12-31 23:30+00');

select is((household_balance('00000000-0000-0000-0000-0000000000b3', '2026-03-15 12:00+01')->>'accrued')::int, 7800, 'maart: opgebouwd jan t/m mrt = 7.800');
select is((household_balance('00000000-0000-0000-0000-0000000000b3', '2026-03-15 12:00+01')->>'available')::int, 6800, 'maart: saldo 7.800 - 1.000 = 6.800 (doorgeschoven)');
select is((household_balance('00000000-0000-0000-0000-0000000000b3', '2026-03-15 12:00+01')->>'spent_month')::int, 0, 'maart: deze maand nog niets besteed');
select is((household_balance('00000000-0000-0000-0000-0000000000b3', '2026-02-20 12:00+01')->>'spent_month')::int, 1000, 'februari: 1.000 besteed deze maand');
select is((household_balance('00000000-0000-0000-0000-0000000000b3', '2027-01-10 12:00+01')->>'accrued')::int, 2600, 'nieuw jaar: alleen januari opgebouwd');
select is((household_balance('00000000-0000-0000-0000-0000000000b3', '2027-01-10 12:00+01')->>'spent_year')::int, 5, 'nieuw jaar: scans van 2026 tellen niet, die van 1 jan 00:30 (Amsterdam) wel');

-- h4: start in november
insert into households (id, name, start_month, budget_override) values
  ('00000000-0000-0000-0000-0000000000b4', 'Familie November', '2026-11-01', 31200);
select is((household_balance('00000000-0000-0000-0000-0000000000b4', '2026-11-20 12:00+01')->>'accrued')::int, 2600, 'start november: alleen november opgebouwd');
select is((household_balance('00000000-0000-0000-0000-0000000000b4', '2026-10-20 12:00+02')->>'available')::int, 0, 'voor de startmaand: geen tegoed');
select is((household_balance('00000000-0000-0000-0000-0000000000b4', '2026-10-20 12:00+02')->>'can_advance')::boolean, false, 'voor de startmaand: geen voorschot');

-- h5: voorschot in maart
insert into households (id, name, start_month, budget_override) values
  ('00000000-0000-0000-0000-0000000000b5', 'Familie Voorschot', '2026-01-01', 31200);
insert into advances (household_id, month, amount) values ('00000000-0000-0000-0000-0000000000b5', '2026-03-01', 2600);
select is((household_balance('00000000-0000-0000-0000-0000000000b5', '2026-03-15 12:00+01')->>'available')::int, 10400, 'maart met voorschot: 7.800 + 2.600');
select is((household_balance('00000000-0000-0000-0000-0000000000b5', '2026-03-15 12:00+01')->>'can_advance')::boolean, false, 'maart: al een voorschot deze maand');
select is((household_balance('00000000-0000-0000-0000-0000000000b5', '2026-03-15 12:00+01')->>'month_budget')::int, 5200, 'maart: maandbudget 2.600 + voorschot 2.600');
select is((household_balance('00000000-0000-0000-0000-0000000000b5', '2026-04-15 12:00+02')->>'available')::int, 10400, 'april: tegoed van april was al gebruikt');
select is((household_balance('00000000-0000-0000-0000-0000000000b5', '2026-04-15 12:00+02')->>'can_advance')::boolean, false, 'april: geen voorschot in de maand na een voorschot');
select is((household_balance('00000000-0000-0000-0000-0000000000b5', '2026-04-15 12:00+02')->>'month_budget')::int, 0, 'april: maandbudget 0');
select is((household_balance('00000000-0000-0000-0000-0000000000b5', '2026-05-15 12:00+02')->>'can_advance')::boolean, true, 'mei: voorschot kan weer');
select is((household_balance('00000000-0000-0000-0000-0000000000b5', '2026-05-15 12:00+02')->>'available')::int, 13000, 'mei: 5 maanden opgebouwd');

-- h6: voorschot in december leent januari
insert into households (id, name, start_month, budget_override) values
  ('00000000-0000-0000-0000-0000000000b6', 'Familie December', '2026-01-01', 31200);
insert into advances (household_id, month, amount) values ('00000000-0000-0000-0000-0000000000b6', '2026-12-01', 2600);
select is((household_balance('00000000-0000-0000-0000-0000000000b6', '2026-12-15 12:00+01')->>'available')::int, 33800, 'december met voorschot: 31.200 + 2.600');
select is((household_balance('00000000-0000-0000-0000-0000000000b6', '2027-01-05 12:00+01')->>'available')::int, 0, 'januari na december-voorschot: 2.600 - 2.600 = 0');
select is((household_balance('00000000-0000-0000-0000-0000000000b6', '2027-01-05 12:00+01')->>'can_advance')::boolean, false, 'januari na december-voorschot: geen nieuw voorschot');
select is((household_balance('00000000-0000-0000-0000-0000000000b6', '2027-02-05 12:00+01')->>'available')::int, 2600, 'februari na december-voorschot: januari blijft verbruikt (2.600, niet 5.200)');
select is((household_balance('00000000-0000-0000-0000-0000000000b6', '2027-06-05 12:00+02')->>'available')::int, 13000, 'juni na december-voorschot: 15.600 − 2.600 = 13.000');

-- ---------------------------------------------------------------------------
-- Registreren als lid (authenticated)
-- ---------------------------------------------------------------------------
-- h2: krap budget: 12 per jaar = 1 per maand, start deze maand
insert into households (id, name, start_month, budget_override, auth_user_id) values
  ('00000000-0000-0000-0000-0000000000b2', 'Familie Krap', date_trunc('month', now() at time zone 'Europe/Amsterdam')::date, 12, '00000000-0000-0000-0000-0000000000a2');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

select is(register_scan('T1')->>'error', 'NO_VISIT', 'zonder bezoek: eerst inchecken');

reset role;
select is((start_visit('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000e001')->>'already')::boolean, false, 'start_visit opent een bezoek');
select is((start_visit('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000e001')->>'already')::boolean, true, 'tweede keer inchecken: al binnen');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

select is(register_scan('ONBEKEND')->>'error', 'UNKNOWN_PRODUCT', 'onbekende code');

create temp table before_scan as select (household_balance('00000000-0000-0000-0000-0000000000b1')->>'available')::int as v;
create temp table scan1 as select register_scan('t3') as r;
select is((select (r->>'ok')::boolean from scan1), true, 'scan lukt met kleine letters');
select is((select (r->'balance'->>'available')::int from scan1), (select v - 3 from before_scan), 'saldo daalt direct met 3 punten');
select is((select r->'product'->>'name' from scan1), 'Test drie', 'resultaat bevat het product');

select is((register_scan('TMAX')->>'ok')::boolean, true, 'eerste van max-product lukt');
select is(register_scan('TMAX')->>'error', 'MAX_REACHED', 'tweede van max-product: maximum bereikt');

select is((remove_scan((select (r->>'scan_id')::uuid from scan1))->'balance'->>'available')::int, (select v - 1 from before_scan), 'terugleggen geeft de 3 punten terug');
select is(remove_scan('00000000-0000-0000-0000-000000000000')->>'error', 'NOT_FOUND', 'onbekende scan terugleggen');

-- krap huishouden
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
reset role;
select ok((start_visit('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-00000000e001')->>'ok')::boolean, 'krap huishouden checkt in');
set local role authenticated;

select is(register_scan('T3')->>'error', 'INSUFFICIENT', '3 punten met saldo 1: te weinig');
select is((register_scan('T3')->>'can_advance')::boolean, false, 'voorschot van 1 helpt niet bij 3 punten');
select is((register_scan('T2')->>'can_advance')::boolean, true, '2 punten: voorschot van volgende maand helpt');
select is((register_scan('T2', true)->>'advance_used')::boolean, true, 'met voorschot lukt de scan');
select is((household_balance('00000000-0000-0000-0000-0000000000b2')->>'available')::int, 0, 'saldo precies op');
select is(register_scan('T1')->>'error', 'INSUFFICIENT', 'saldo op: volgende scan geweigerd');
select is((register_scan('T1', true)->>'ok')::boolean, false, 'tweede voorschot in dezelfde maand kan niet');

-- afronden bij de kassa (de server roept dit aan als service role), daarna niet meer terugleggen
set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select is((finish_visit('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000e002')->>'ok')::boolean, true, 'uitchecken lukt');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select is(remove_scan((select id from scans where household_id = '00000000-0000-0000-0000-0000000000b1' and removed_at is null limit 1))->>'error', 'VISIT_CLOSED', 'na de kassa niet meer terugleggen');
select is(register_scan('T1')->>'error', 'NO_VISIT', 'na de kassa: geen open bezoek meer');

select * from finish();
rollback;
