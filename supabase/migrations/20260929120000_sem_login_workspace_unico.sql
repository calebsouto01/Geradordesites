-- Modo sem login (temporário): um único workspace compartilhado, acesso anônimo liberado.
alter table public.profiles drop constraint profiles_id_fkey;
alter table public.searches drop constraint searches_user_id_fkey;
alter table public.search_results drop constraint search_results_user_id_fkey;
alter table public.leads drop constraint leads_user_id_fkey;

alter table public.searches alter column user_id set default '00000000-0000-0000-0000-000000000001';
alter table public.search_results alter column user_id set default '00000000-0000-0000-0000-000000000001';
alter table public.leads alter column user_id set default '00000000-0000-0000-0000-000000000001';

insert into public.profiles (id, monthly_quota)
values ('00000000-0000-0000-0000-000000000001', 30) on conflict (id) do nothing;

drop policy "profiles_select_own" on public.profiles;
drop policy "searches_select_own" on public.searches;
drop policy "results_select_own" on public.search_results;
drop policy "results_update_own" on public.search_results;
drop policy "leads_all_own" on public.leads;

create policy "profiles_select" on public.profiles for select to anon, authenticated using (true);
create policy "searches_select" on public.searches for select to anon, authenticated using (true);
create policy "results_all" on public.search_results for all to anon, authenticated using (true) with check (true);
create policy "leads_all" on public.leads for all to anon, authenticated using (true) with check (true);

create or replace function public.consume_search(p_location text, p_category text, p_min_rating numeric)
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_uid constant uuid := '00000000-0000-0000-0000-000000000001';
  v_quota int;
  v_used int;
begin
  select monthly_quota into v_quota from public.profiles where id = v_uid for update;
  select count(*) into v_used from public.searches
    where user_id = v_uid and created_at >= date_trunc('month', now());
  if v_used >= v_quota then raise exception 'quota_exceeded'; end if;
  insert into public.searches (user_id, location, category, min_rating)
    values (v_uid, p_location, p_category, p_min_rating);
  return v_quota - v_used - 1;
end $$;

create or replace function public.quota_remaining() returns int
language sql stable security definer set search_path = '' as $$
  select p.monthly_quota - (select count(*) from public.searches s
    where s.user_id = p.id and s.created_at >= date_trunc('month', now()))::int
  from public.profiles p where p.id = '00000000-0000-0000-0000-000000000001'
$$;

grant execute on function public.consume_search(text,text,numeric) to anon, authenticated;
grant execute on function public.quota_remaining() to anon, authenticated;
