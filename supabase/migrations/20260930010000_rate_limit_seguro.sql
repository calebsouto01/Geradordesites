-- O contador genérico deixa de ser chamável por clientes: usuários usam hit_rate_user (chave = auth.uid()) e anônimos hit_rate_ip.
revoke all on function public.hit_rate(text, int, int) from public, anon, authenticated;

create function public.hit_rate_user(p_name text, p_limit int, p_window int) returns boolean
language sql security definer set search_path = '' as $$
  select case when auth.uid() is null then false else public.hit_rate(left(p_name, 30) || ':u:' || auth.uid(), p_limit, p_window) end
$$;

create function public.hit_rate_ip(p_name text, p_ip text, p_limit int, p_window int) returns boolean
language sql security definer set search_path = '' as $$
  select public.hit_rate(left(p_name, 30) || ':ip:' || left(coalesce(p_ip, 'x'), 64), p_limit, p_window)
$$;

revoke all on function public.hit_rate_user(text, int, int) from public, anon;
revoke all on function public.hit_rate_ip(text, text, int, int) from public;
grant execute on function public.hit_rate_user(text, int, int) to authenticated;
grant execute on function public.hit_rate_ip(text, text, int, int) to anon, authenticated;

drop function if exists public.track_view(text);
