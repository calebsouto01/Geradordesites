-- Mensagens personalizadas por lead (1 crédito): ledger aceita o novo tipo e o resultado fica guardado no lead.
do $$
declare c text;
begin
  select conname into c from pg_constraint where conrelid = 'public.credit_ledger'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%kind%';
  if c is not null then execute format('alter table public.credit_ledger drop constraint %I', c); end if;
end $$;
alter table public.credit_ledger add constraint credit_ledger_kind_check check (kind in ('busca','site','mensagens'));
alter table public.leads add column if not exists messages jsonb;

create or replace function public.consume_messages(p_ref text) returns int
language sql security definer set search_path = '' as $$ select public.spend_credits('mensagens', 1, left(p_ref, 200)) $$;
revoke all on function public.consume_messages(text) from public, anon;
grant execute on function public.consume_messages(text) to authenticated;
