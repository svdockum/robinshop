-- Reviewfix: bij een nieuwe pascode moeten telefoons die met de oude (mogelijk gestolen)
-- pas zijn ingelogd ook worden uitgelogd. Sessies verwijderen maakt hun refresh tokens
-- ongeldig; een lopend access token verloopt binnen het uur.
create or replace function public.revoke_household_sessions(p_household uuid)
returns int
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  removed int;
begin
  delete from auth.sessions
  where user_id = (select auth_user_id from public.households where id = p_household);
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke execute on function public.revoke_household_sessions(uuid) from public, anon, authenticated;
grant execute on function public.revoke_household_sessions(uuid) to service_role;
