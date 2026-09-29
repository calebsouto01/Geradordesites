create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  monthly_quota int not null default 30,
  created_at timestamptz not null default now()
);

create table public.searches (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  location text not null,
  category text not null,
  min_rating numeric(2,1) not null,
  created_at timestamptz not null default now()
);
create index searches_user_month_idx on public.searches (user_id, created_at);

create type public.result_status as enum ('novo','promovido','descartado');

create table public.search_results (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id text not null,
  name text not null,
  address text,
  phone text,
  rating numeric(2,1),
  rating_count int,
  status public.result_status not null default 'novo',
  created_at timestamptz not null default now(),
  unique (user_id, place_id)
);

create type public.lead_stage as enum
  ('novo','contato_iniciado','qualificado','proposta_enviada','negociacao','fechado','perdido');

create table public.leads (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id text,
  name text not null,
  phone text,
  address text,
  origin text not null default 'Prospecção Maps',
  stage public.lead_stage not null default 'novo',
  estimated_value numeric(12,2),
  owner text,
  next_contact date,
  lost_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, place_id)
);
create index leads_user_stage_idx on public.leads (user_id, stage);

alter table public.profiles enable row level security;
alter table public.searches enable row level security;
alter table public.search_results enable row level security;
alter table public.leads enable row level security;

create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());
create policy "searches_select_own" on public.searches for select using (user_id = auth.uid());
create policy "results_select_own" on public.search_results for select using (user_id = auth.uid());
create policy "results_update_own" on public.search_results for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "leads_all_own" on public.leads for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- perfil automático no cadastro
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- cota mensal checada no servidor: consome 1 busca ou falha
create function public.consume_search(p_location text, p_category text, p_min_rating numeric)
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_quota int;
  v_used int;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  select monthly_quota into v_quota from public.profiles where id = v_uid for update;
  if v_quota is null then raise exception 'no_profile'; end if;
  select count(*) into v_used from public.searches
    where user_id = v_uid and created_at >= date_trunc('month', now());
  if v_used >= v_quota then raise exception 'quota_exceeded'; end if;
  insert into public.searches (user_id, location, category, min_rating)
    values (v_uid, p_location, p_category, p_min_rating);
  return v_quota - v_used - 1;
end $$;
revoke all on function public.consume_search(text,text,numeric) from public, anon;
grant execute on function public.consume_search(text,text,numeric) to authenticated;

create function public.quota_remaining() returns int
language sql stable security definer set search_path = '' as $$
  select p.monthly_quota - (select count(*) from public.searches s
    where s.user_id = p.id and s.created_at >= date_trunc('month', now()))::int
  from public.profiles p where p.id = auth.uid()
$$;
revoke all on function public.quota_remaining() from public, anon;
grant execute on function public.quota_remaining() to authenticated;

create function public.touch_updated_at() returns trigger language plpgsql
set search_path = '' as $$ begin new.updated_at = now(); return new; end $$;
create trigger leads_touch before update on public.leads
  for each row execute function public.touch_updated_at();
