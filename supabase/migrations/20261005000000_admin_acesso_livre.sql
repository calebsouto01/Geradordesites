-- Acesso livre para administradores: créditos ilimitados e sem limite de uso. Vale só para e-mail confirmado.
create table if not exists public.admins (email text primary key);
alter table public.admins enable row level security; -- sem políticas: ninguém lê pela API
insert into public.admins (email) values ('kaleb_souto@hotmail.com') on conflict do nothing;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u join public.admins a on lower(a.email) = lower(u.email)
    where u.id = auth.uid() and u.email_confirmed_at is not null)
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create or replace function public.credits_remaining() returns int
language sql stable security definer set search_path = '' as $$
  select case
    when public.is_admin() then 999999
    when exists (select 1 from public.subscriptions s where s.user_id = auth.uid() and s.status in ('active','trialing','past_due')
                 and (s.current_period_end is null or s.current_period_end > now() - interval '3 days'))
    then (select p.credits from public.subscriptions s join public.plans p on p.id = s.plan_id where s.user_id = auth.uid())
         - coalesce((select sum(l.cost) from public.credit_ledger l where l.user_id = auth.uid() and l.created_at >= date_trunc('month', now())), 0)::int
    else coalesce((select pr.trial_credits from public.profiles pr where pr.id = auth.uid()), 0)
         - coalesce((select sum(l.cost) from public.credit_ledger l where l.user_id = auth.uid()), 0)::int
  end
$$;

create or replace function public.spend_credits(p_kind text, p_cost int, p_ref text) returns int
language plpgsql security definer set search_path = '' as $$
declare v_left int;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if public.is_admin() then return 999999; end if;
  perform 1 from public.profiles where id = auth.uid() for update;
  v_left := public.credits_remaining();
  if v_left < p_cost then raise exception 'insufficient_credits'; end if;
  insert into public.credit_ledger (kind, cost, ref) values (p_kind, p_cost, left(p_ref, 200));
  return v_left - p_cost;
end $$;

create or replace function public.hit_rate_user(p_name text, p_limit int, p_window int) returns boolean
language sql security definer set search_path = '' as $$
  select case when auth.uid() is null then false
              when public.is_admin() then true
              else public.hit_rate(left(p_name, 30) || ':u:' || auth.uid(), p_limit, p_window) end
$$;
