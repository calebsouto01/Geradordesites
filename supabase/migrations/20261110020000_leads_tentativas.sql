-- Quantas vezes houve contato com cada lead (uma por ligação registrada), mantido por gatilho.
alter table public.leads add column tentativas integer not null default 0;
update public.leads l set tentativas = (select count(*) from public.calls c where c.lead_id = l.id) where exists (select 1 from public.calls c where c.lead_id = l.id);
create function public.leads_tentativas() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' and new.lead_id is not null then
    update public.leads set tentativas = tentativas + 1 where id = new.lead_id;
  elsif tg_op = 'DELETE' and old.lead_id is not null then
    update public.leads set tentativas = greatest(tentativas - 1, 0) where id = old.lead_id;
  end if;
  return null;
end $$;
create trigger calls_tentativas after insert or delete on public.calls for each row execute function public.leads_tentativas();
create index leads_user_fila_idx on public.leads (user_id, local, tentativas, rating desc nulls last);
