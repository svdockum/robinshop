-- Testdata voor lokaal ontwikkelen en de testwinkel.

insert into public.categories (id, name, color, sort) values
  ('10000000-0000-0000-0000-000000000001', 'Groente & fruit', '#115656', 1),
  ('10000000-0000-0000-0000-000000000002', 'Zuivel', '#fd644e', 2),
  ('10000000-0000-0000-0000-000000000003', 'Graanproducten', '#115656', 3),
  ('10000000-0000-0000-0000-000000000004', 'Overige plantaardig', '#fd644e', 4);

-- Kratten in de testopstelling: 1, 2, 3 en 4 eetpunten.
insert into public.products (code, name, category_id, storage, points, portion, max_per_visit) values
  ('PREI', 'Prei', '10000000-0000-0000-0000-000000000001', 'vers', 1, '1 stuk', null),
  ('APPELS', 'Appels', '10000000-0000-0000-0000-000000000001', 'vers', 2, '1 stuk', null),
  ('AARDAPPELS', 'Aardappels', '10000000-0000-0000-0000-000000000001', 'vers', 3, '1 kilo', null),
  ('POMPOEN', 'Pompoen', '10000000-0000-0000-0000-000000000001', 'vers', 4, '1 stuk', 2),
  ('BROOD', 'Robin brood', '10000000-0000-0000-0000-000000000003', 'vers', 10, '1 brood', null),
  ('MELK', 'Melk', '10000000-0000-0000-0000-000000000002', 'koel', 7, '1 liter', null),
  ('YOGHURT', 'Yoghurt', '10000000-0000-0000-0000-000000000002', 'koel', 5, '500 gram', null),
  ('HAVERMOUT', 'Havermout', '10000000-0000-0000-0000-000000000003', 'houdbaar', 3, '1 schep', null),
  ('LINZEN', 'Linzen', '10000000-0000-0000-0000-000000000004', 'houdbaar', 3, '1 schep', null);

-- Vaste displaysleutels voor lokaal testen (in productie willekeurig).
insert into public.scan_points (slug, name, kind, interval_seconds, display_key) values
  ('ingang', 'Ingang (poortje)', 'entrance', 60, 'dev-ingang-sleutel-0001'),
  ('kassa', 'Kassa', 'checkout', 60, 'dev-kassa-sleutel-0001');

-- Familie uit de ontwerpen: 2 volwassenen, kind van 12, kinderen van 8 en 5 → 31.200 punten per jaar.
insert into public.households (id, name, email, start_month, card_code) values
  ('20000000-0000-0000-0000-000000000001', 'Familie Yilmaz', null, '2026-01-01', 'DEMO-YILMAZ-PAS-0001');
insert into public.household_members (household_id, name, age) values
  ('20000000-0000-0000-0000-000000000001', 'Ayşe', 41),
  ('20000000-0000-0000-0000-000000000001', 'Mehmet', 43),
  ('20000000-0000-0000-0000-000000000001', 'Elif', 12),
  ('20000000-0000-0000-0000-000000000001', 'Can', 8),
  ('20000000-0000-0000-0000-000000000001', 'Lina', 5);

-- Klein huishouden om "te weinig punten" en het voorschot te testen: 1 volwassene, start deze maand.
insert into public.households (id, name, start_month, budget_override, card_code) values
  ('20000000-0000-0000-0000-000000000002', 'Familie de Vries', date_trunc('month', now() at time zone 'Europe/Amsterdam')::date, 120, 'DEMO-DEVRIES-PAS-0002');
insert into public.household_members (household_id, name, age) values
  ('20000000-0000-0000-0000-000000000002', 'Sanne', 34);
