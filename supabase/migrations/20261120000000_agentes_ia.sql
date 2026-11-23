-- Agentes de IA (atendimento por WhatsApp): um ou mais agentes por usuário.
create table public.agentes (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 80),
  empresa text check (empresa is null or char_length(empresa) <= 120),
  tom text not null default 'amigavel' check (tom in ('amigavel','formal','descontraido','objetivo')),
  instrucoes text check (instrucoes is null or char_length(instrucoes) <= 4000),
  conhecimento text check (conhecimento is null or char_length(conhecimento) <= 20000),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);
create index agentes_user_idx on public.agentes (user_id, created_at desc);
alter table public.agentes enable row level security;
create policy agentes_own on public.agentes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.agentes from anon;
