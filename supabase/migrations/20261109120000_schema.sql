-- Robin shop-scan: tabellen, rechten en row level security.

create extension if not exists pgcrypto with schema extensions;

-- Willekeurige, URL-veilige code (pascode, displaysleutel).
create or replace function public.random_code(len int)
returns text
language sql
volatile
set search_path = ''
as $$
  select substr(translate(encode(extensions.gen_random_bytes(48), 'base64'), '+/', '-_'), 1, len)
$$;

-- ---------------------------------------------------------------------------
-- Tabellen
-- ---------------------------------------------------------------------------

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 60),
  color text not null default '#115656' check (color ~ '^#[0-9a-fA-F]{6}$'),
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9-]{2,32}$'),
  name text not null check (length(trim(name)) between 1 and 80),
  category_id uuid references public.categories (id) on delete set null,
  storage text not null default 'vers' check (storage in ('vers', 'koel', 'vries', 'houdbaar')),
  points int not null check (points between 1 and 999),
  portion text not null default '1 stuk' check (length(portion) <= 40),
  max_per_visit int check (max_per_visit is null or max_per_visit >= 1),
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index products_category_idx on public.products (category_id);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 80),
  email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  start_month date not null
    default date_trunc('month', now() at time zone 'Europe/Amsterdam')::date
    check (extract(day from start_month) = 1),
  budget_override int check (budget_override is null or budget_override >= 0),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  card_code text not null unique default public.random_code(20) check (card_code ~ '^[A-Za-z0-9_-]{8,64}$'),
  notes text,
  created_at timestamptz not null default now()
);

create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text,
  age int not null check (age between 0 and 120),
  created_at timestamptz not null default now()
);
create index household_members_household_idx on public.household_members (household_id);

create table public.scan_points (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,40}$'),
  name text not null check (length(trim(name)) between 1 and 60),
  kind text not null check (kind in ('entrance', 'checkout')),
  interval_seconds int not null default 60 check (interval_seconds between 10 and 86400),
  display_key text not null default public.random_code(24),
  created_at timestamptz not null default now()
);

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  entrance_id uuid references public.scan_points (id) on delete set null,
  checkout_id uuid references public.scan_points (id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  status text not null default 'open' check (status in ('open', 'closed', 'expired'))
);
create index visits_household_idx on public.visits (household_id, started_at desc);
-- Maximaal één open bezoek per huishouden.
create unique index visits_one_open_idx on public.visits (household_id) where status = 'open';

create table public.scans (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  user_id uuid references auth.users (id) on delete set null,
  points int not null check (points >= 0),
  quantity int not null default 1 check (quantity >= 1),
  created_at timestamptz not null default now(),
  removed_at timestamptz
);
create index scans_household_idx on public.scans (household_id, created_at);
create index scans_visit_idx on public.scans (visit_id);
create index scans_product_idx on public.scans (product_id);

create table public.advances (
  household_id uuid not null references public.households (id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  amount int not null check (amount >= 0),
  created_at timestamptz not null default now(),
  primary key (household_id, month)
);

create table public.display_events (
  id bigint generated always as identity primary key,
  scan_point_id uuid not null references public.scan_points (id) on delete cascade,
  kind text not null check (kind in ('welcome', 'checkout')),
  title text not null,
  detail text,
  created_at timestamptz not null default now()
);
create index display_events_point_idx on public.display_events (scan_point_id, id);

-- ---------------------------------------------------------------------------
-- Helpers voor RLS
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()))
$$;

create or replace function public.my_household_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.households where auth_user_id = (select auth.uid())
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.scan_points enable row level security;
alter table public.visits enable row level security;
alter table public.scans enable row level security;
alter table public.advances enable row level security;
alter table public.display_events enable row level security;

-- Anonieme bezoekers lezen niets rechtstreeks; alles loopt via inloggen of de server.
revoke all on all tables in schema public from anon;

create policy "admins: eigen rij lezen" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

create policy "categories: lezen" on public.categories
  for select to authenticated using (true);
create policy "categories: beheer" on public.categories
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "products: lezen" on public.products
  for select to authenticated using (true);
create policy "products: beheer" on public.products
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "households: eigen huishouden lezen" on public.households
  for select to authenticated using (auth_user_id = (select auth.uid()));
create policy "households: beheer" on public.households
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "household_members: eigen huishouden lezen" on public.household_members
  for select to authenticated using (household_id = (select public.my_household_id()));
create policy "household_members: beheer" on public.household_members
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "scan_points: beheer" on public.scan_points
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "visits: eigen huishouden lezen" on public.visits
  for select to authenticated using (household_id = (select public.my_household_id()));
create policy "visits: beheer" on public.visits
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "scans: eigen huishouden lezen" on public.scans
  for select to authenticated using (household_id = (select public.my_household_id()));
create policy "scans: beheer" on public.scans
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "advances: eigen huishouden lezen" on public.advances
  for select to authenticated using (household_id = (select public.my_household_id()));
create policy "advances: beheer" on public.advances
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- display_events: geen policies; alleen de server (service role) leest en schrijft.
