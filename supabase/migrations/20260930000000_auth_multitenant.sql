-- Contas, isolamento por usuário (RLS), planos e assinaturas, limites de uso, eventos do site e denúncias.
-- Depois desta migração o app exige login. Dados do "workspace único" antigo ficam sem dono (invisíveis no painel).

-- ===== Planos e assinaturas =====
create table public.plans (
  id text primary key, name text not null, price_cents int not null, credits int not null, active boolean not null default true
);
insert into public.plans (id, name, price_cents, credits) values ('inicial', 'Plano Inicial', 4990, 45);
alter table public.plans enable row level security;
create policy "plans_read" on public.plans for select to anon, authenticated using (active);

create table public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_id text not null references public.plans(id),
  status text not null check (status in ('trialing','active','past_due','canceled')),
  provider text, provider_customer text, provider_subscription text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
create policy "subs_select_own" on public.subscriptions for select to authenticated using (user_id = auth.uid());
-- escrita apenas pelo servidor (chave de serviço), via webhook do gateway

-- ===== Perfil =====
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists trial_credits int not null default 6;
alter table public.profiles alter column monthly_credits set default 0;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict (id) do nothing;
  return new;
end $$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- ===== Dono das linhas: auth.uid() =====
alter table public.leads alter column user_id set default auth.uid();
alter table public.searches alter column user_id set default auth.uid();
alter table public.search_results alter column user_id set default auth.uid();
alter table public.sites alter column user_id set default auth.uid();
alter table public.credit_ledger alter column user_id set default auth.uid();

alter table public.leads add constraint leads_user_fk foreign key (user_id) references auth.users(id) on delete cascade not valid;
alter table public.searches add constraint searches_user_fk foreign key (user_id) references auth.users(id) on delete cascade not valid;
alter table public.search_results add constraint results_user_fk foreign key (user_id) references auth.users(id) on delete cascade not valid;
alter table public.sites add constraint sites_user_fk foreign key (user_id) references auth.users(id) on delete cascade not valid;
alter table public.credit_ledger add constraint ledger_user_fk foreign key (user_id) references auth.users(id) on delete cascade not valid;

drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "searches_select" on public.searches;
drop policy if exists "results_all" on public.search_results;
drop policy if exists "leads_all" on public.leads;
drop policy if exists "sites_all" on public.sites;
drop policy if exists "ledger_select" on public.credit_ledger;

create policy "profiles_select_own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "searches_select_own" on public.searches for select to authenticated using (user_id = auth.uid());
create policy "ledger_select_own" on public.credit_ledger for select to authenticated using (user_id = auth.uid());
create policy "results_own" on public.search_results for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "leads_own" on public.leads for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "sites_own" on public.sites for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- sites podem ser bloqueados (denúncia) e ter domínio próprio
alter table public.sites drop constraint if exists sites_status_check;
alter table public.sites add constraint sites_status_check check (status in ('previa','publicado','bloqueado'));
alter table public.sites add column if not exists custom_domain text unique;

-- ===== Créditos (por usuário) =====
drop function if exists public.spend_credits(text, int, text);
drop function if exists public.credits_remaining();

create function public.credits_remaining() returns int
language sql stable security definer set search_path = '' as $$
  select case
    when exists (select 1 from public.subscriptions s where s.user_id = auth.uid() and s.status in ('active','trialing','past_due')
                 and (s.current_period_end is null or s.current_period_end > now() - interval '3 days'))
    then (select p.credits from public.subscriptions s join public.plans p on p.id = s.plan_id where s.user_id = auth.uid())
         - coalesce((select sum(l.cost) from public.credit_ledger l where l.user_id = auth.uid() and l.created_at >= date_trunc('month', now())), 0)::int
    else coalesce((select pr.trial_credits from public.profiles pr where pr.id = auth.uid()), 0)
         - coalesce((select sum(l.cost) from public.credit_ledger l where l.user_id = auth.uid()), 0)::int
  end
$$;

create function public.spend_credits(p_kind text, p_cost int, p_ref text) returns int
language plpgsql security definer set search_path = '' as $$
declare v_left int;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  perform 1 from public.profiles where id = auth.uid() for update;
  v_left := public.credits_remaining();
  if v_left < p_cost then raise exception 'insufficient_credits'; end if;
  insert into public.credit_ledger (kind, cost, ref) values (p_kind, p_cost, left(p_ref, 200));
  return v_left - p_cost;
end $$;

create or replace function public.consume_search(p_location text, p_category text, p_min_rating numeric)
returns int language plpgsql security definer set search_path = '' as $$
declare v_left int;
begin
  v_left := public.spend_credits('busca', 3, p_location || ' / ' || p_category);
  insert into public.searches (location, category, min_rating) values (left(p_location, 120), left(p_category, 120), p_min_rating);
  return v_left;
end $$;

create or replace function public.consume_site(p_ref text) returns int
language sql security definer set search_path = '' as $$ select public.spend_credits('site', 3, p_ref) $$;

revoke all on function public.credits_remaining() from public, anon;
revoke all on function public.spend_credits(text, int, text) from public, anon, authenticated;
revoke all on function public.consume_search(text, text, numeric) from public, anon;
revoke all on function public.consume_site(text) from public, anon;
grant execute on function public.credits_remaining() to authenticated;
grant execute on function public.consume_search(text, text, numeric) to authenticated;
grant execute on function public.consume_site(text) to authenticated;

-- ===== Limite de requisições (por chave e janela) =====
create table public.rate_limits (key text not null, bucket timestamptz not null, n int not null default 1, primary key (key, bucket));
alter table public.rate_limits enable row level security;

create function public.hit_rate(p_key text, p_limit int, p_window int) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_bucket timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window) * p_window); v_n int;
begin
  insert into public.rate_limits (key, bucket) values (left(p_key, 200), v_bucket)
    on conflict (key, bucket) do update set n = public.rate_limits.n + 1 returning n into v_n;
  if random() < 0.01 then delete from public.rate_limits where bucket < now() - interval '2 hours'; end if;
  return v_n <= p_limit;
end $$;
revoke all on function public.hit_rate(text, int, int) from public;
grant execute on function public.hit_rate(text, int, int) to anon, authenticated;

-- ===== Eventos do site, mensagens do formulário e denúncias =====
create table public.site_events (
  id bigint generated always as identity primary key,
  site_id bigint not null references public.sites(id) on delete cascade,
  kind text not null check (kind in ('view','whatsapp','mapa','form')),
  created_at timestamptz not null default now()
);
create index site_events_site_idx on public.site_events (site_id, created_at);
alter table public.site_events enable row level security;
create policy "events_owner" on public.site_events for select to authenticated using (exists (select 1 from public.sites s where s.id = site_id and s.user_id = auth.uid()));

create table public.site_leads (
  id bigint generated always as identity primary key,
  site_id bigint not null references public.sites(id) on delete cascade,
  name text not null, phone text, message text, created_at timestamptz not null default now()
);
create index site_leads_site_idx on public.site_leads (site_id, created_at);
alter table public.site_leads enable row level security;
create policy "siteleads_owner" on public.site_leads for select to authenticated using (exists (select 1 from public.sites s where s.id = site_id and s.user_id = auth.uid()));

create table public.reports (
  id bigint generated always as identity primary key,
  slug text not null, reason text not null, contact text, created_at timestamptz not null default now()
);
alter table public.reports enable row level security; -- sem policies: só o servidor (chave de serviço) lê

create or replace function public.get_site(p_slug text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select to_jsonb(s) - 'user_id' from public.sites s
  where s.slug = p_slug and s.status <> 'bloqueado' and (s.status = 'publicado' or s.expires_at > now())
$$;

create function public.record_event(p_slug text, p_kind text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_id bigint; v_recent int;
begin
  if p_kind not in ('view','whatsapp','mapa') then return; end if;
  select id into v_id from public.sites where slug = p_slug and status <> 'bloqueado' and (status = 'publicado' or expires_at > now());
  if v_id is null then return; end if;
  select count(*) into v_recent from public.site_events where site_id = v_id and created_at > now() - interval '1 minute';
  if v_recent >= 120 then return; end if;  -- teto por site, independe de quem chama
  insert into public.site_events (site_id, kind) values (v_id, p_kind);
  if p_kind = 'view' then
    update public.sites set views = views + 1, first_viewed_at = coalesce(first_viewed_at, now()), last_viewed_at = now() where id = v_id;
  end if;
end $$;

create function public.submit_site_lead(p_slug text, p_name text, p_phone text, p_message text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_id bigint; v_recent int;
begin
  if length(coalesce(trim(p_name), '')) < 2 then return false; end if;
  select id into v_id from public.sites where slug = p_slug and status <> 'bloqueado' and (status = 'publicado' or expires_at > now());
  if v_id is null then return false; end if;
  select count(*) into v_recent from public.site_leads where site_id = v_id and created_at > now() - interval '1 hour';
  if v_recent >= 20 then return false; end if;
  insert into public.site_leads (site_id, name, phone, message) values (v_id, left(trim(p_name), 80), left(coalesce(p_phone, ''), 30), left(coalesce(p_message, ''), 600));
  insert into public.site_events (site_id, kind) values (v_id, 'form');
  return true;
end $$;

create function public.submit_report(p_slug text, p_reason text, p_contact text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if length(coalesce(trim(p_reason), '')) < 5 then return false; end if;
  if not public.hit_rate('report:' || left(p_slug, 80), 5, 3600) then return false; end if;
  insert into public.reports (slug, reason, contact) values (left(p_slug, 80), left(trim(p_reason), 1000), left(coalesce(p_contact, ''), 120));
  return true;
end $$;

revoke all on function public.record_event(text, text) from public;
revoke all on function public.submit_site_lead(text, text, text, text) from public;
revoke all on function public.submit_report(text, text, text) from public;
grant execute on function public.get_site(text) to anon, authenticated;
grant execute on function public.record_event(text, text) to anon, authenticated;
grant execute on function public.submit_site_lead(text, text, text, text) to anon, authenticated;
grant execute on function public.submit_report(text, text, text) to anon, authenticated;
revoke execute on function public.track_view(text) from anon, authenticated;

-- ===== Uploads: só usuários logados, na própria pasta =====
drop policy if exists "uploads_insert" on storage.objects;
drop policy if exists "uploads_select" on storage.objects;
create policy "uploads_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "uploads_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);
