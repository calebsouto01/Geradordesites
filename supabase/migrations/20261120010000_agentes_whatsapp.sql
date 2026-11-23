-- Conexão do agente com o WhatsApp Business Cloud API (Meta) e histórico de mensagens.
create table public.agente_whatsapp (
  agente_id bigint primary key references public.agentes(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  phone_number_id text not null unique check (phone_number_id ~ '^[0-9]{5,30}$'),
  access_token text not null,
  resposta_padrao text check (resposta_padrao is null or char_length(resposta_padrao) <= 1000),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.agente_whatsapp enable row level security;
create policy agente_whatsapp_own on public.agente_whatsapp for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.agente_whatsapp from anon, authenticated;
-- O token nunca volta para o navegador: o cliente lê só as colunas não secretas.
grant select (agente_id, user_id, phone_number_id, resposta_padrao, ativo, created_at) on public.agente_whatsapp to authenticated;
grant insert, update, delete on public.agente_whatsapp to authenticated;

create table public.whatsapp_mensagens (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  agente_id bigint not null references public.agentes(id) on delete cascade,
  contato text not null,
  direcao text not null check (direcao in ('entrada','saida')),
  texto text not null,
  wamid text unique,
  created_at timestamptz not null default now()
);
create index whatsapp_mensagens_agente_idx on public.whatsapp_mensagens (agente_id, created_at desc);
alter table public.whatsapp_mensagens enable row level security;
create policy whatsapp_mensagens_own on public.whatsapp_mensagens for select to authenticated using (user_id = auth.uid());
revoke all on public.whatsapp_mensagens from anon;
revoke insert, update, delete on public.whatsapp_mensagens from authenticated;
