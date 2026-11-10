-- Cada lead fica em um local: prospecção (lista de ligação), retorno, armazenado, sites (funil) ou descartado.
alter table public.leads
  add column local text not null default 'prospeccao' check (local in ('prospeccao','retorno','armazenado','sites','descartado')),
  add column observacao text check (observacao is null or char_length(observacao) <= 1000),
  add column retorno_em timestamptz,
  add column rating numeric,
  add column rating_count integer;
create index leads_user_local_idx on public.leads (user_id, local);
-- Uma única atualização por linha: quem já tem site ou passou da primeira etapa fica em Sites; "Contato iniciado" deixa de existir como coluna.
update public.leads set
  rating = nullif(profile->>'rating','')::numeric,
  rating_count = nullif(profile->>'ratingCount','')::integer,
  local = case when stage <> 'novo' or exists (select 1 from public.sites s where s.lead_id = leads.id) then 'sites' else 'prospeccao' end,
  stage = case when stage = 'contato_iniciado' then 'novo'::public.lead_stage else stage end;
