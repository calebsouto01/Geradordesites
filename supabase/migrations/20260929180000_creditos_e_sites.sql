-- Créditos: 3 por busca, 3 por site. Plano inicial: 90 créditos/mês.
alter table public.profiles rename column monthly_quota to monthly_credits;
alter table public.profiles alter column monthly_credits set default 90;
update public.profiles set monthly_credits = 90;

create table public.credit_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null default '00000000-0000-0000-0000-000000000001',
  kind text not null check (kind in ('busca','site')),
  cost int not null,
  ref text,
  created_at timestamptz not null default now()
);
create index credit_ledger_user_month_idx on public.credit_ledger (user_id, created_at);
alter table public.credit_ledger enable row level security;
create policy "ledger_select" on public.credit_ledger for select to anon, authenticated using (true);

insert into public.credit_ledger (user_id, kind, cost, ref, created_at)
  select user_id, 'busca', 3, id::text, created_at from public.searches;

drop function public.quota_remaining();
drop function public.consume_search(text,text,numeric);

create function public.credits_remaining() returns int
language sql stable security definer set search_path = '' as $$
  select p.monthly_credits - coalesce((select sum(l.cost) from public.credit_ledger l
    where l.user_id = p.id and l.created_at >= date_trunc('month', now())), 0)::int
  from public.profiles p where p.id = '00000000-0000-0000-0000-000000000001'
$$;

create function public.spend_credits(p_kind text, p_cost int, p_ref text) returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_uid constant uuid := '00000000-0000-0000-0000-000000000001';
  v_total int; v_used int;
begin
  select monthly_credits into v_total from public.profiles where id = v_uid for update;
  select coalesce(sum(cost),0) into v_used from public.credit_ledger
    where user_id = v_uid and created_at >= date_trunc('month', now());
  if v_used + p_cost > v_total then raise exception 'insufficient_credits'; end if;
  insert into public.credit_ledger (user_id, kind, cost, ref) values (v_uid, p_kind, p_cost, p_ref);
  return v_total - v_used - p_cost;
end $$;

create function public.consume_search(p_location text, p_category text, p_min_rating numeric)
returns int language plpgsql security definer set search_path = '' as $$
declare v_left int;
begin
  v_left := public.spend_credits('busca', 3, p_location || ' / ' || p_category);
  insert into public.searches (location, category, min_rating) values (p_location, p_category, p_min_rating);
  return v_left;
end $$;

create function public.consume_site(p_ref text) returns int
language sql security definer set search_path = '' as $$
  select public.spend_credits('site', 3, p_ref)
$$;

revoke all on function public.spend_credits(text,int,text) from public, anon, authenticated;
grant execute on function public.credits_remaining() to anon, authenticated;
grant execute on function public.consume_search(text,text,numeric) to anon, authenticated;
grant execute on function public.consume_site(text) to anon, authenticated;

alter table public.leads add column profile jsonb;

create table public.sites (
  id bigint generated always as identity primary key,
  user_id uuid not null default '00000000-0000-0000-0000-000000000001',
  lead_id bigint not null unique references public.leads(id) on delete cascade,
  slug text not null unique,
  status text not null default 'previa' check (status in ('previa','publicado')),
  template text not null,
  content jsonb not null,
  expires_at timestamptz,
  views int not null default 0,
  first_viewed_at timestamptz,
  last_viewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.sites enable row level security;
create policy "sites_all" on public.sites for all to anon, authenticated using (true) with check (true);
create trigger sites_touch before update on public.sites
  for each row execute function public.touch_updated_at();

create function public.get_site(p_slug text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select to_jsonb(s) - 'user_id' from public.sites s
  where s.slug = p_slug and (s.status = 'publicado' or s.expires_at > now())
$$;

create function public.track_view(p_slug text) returns void
language sql security definer set search_path = '' as $$
  update public.sites set views = views + 1,
    first_viewed_at = coalesce(first_viewed_at, now()), last_viewed_at = now()
  where slug = p_slug and (status = 'publicado' or expires_at > now())
$$;

grant execute on function public.get_site(text) to anon, authenticated;
grant execute on function public.track_view(text) to anon, authenticated;
