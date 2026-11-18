-- Histórico de ligações: script usado, caminho percorrido na árvore, objeções e resultado.
create table public.calls (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lead_id bigint references public.leads(id) on delete cascade,
  script smallint not null,
  path text[] not null default '{}',
  objections text[] not null default '{}',
  outcome text not null check (outcome in ('falou_dono','atendente','nao_atendeu','retorno')),
  created_at timestamptz not null default now()
);
create index calls_user_idx on public.calls (user_id, created_at desc);
create index calls_lead_idx on public.calls (lead_id);
alter table public.calls enable row level security;
create policy calls_own on public.calls for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.calls from anon;
alter table public.calls add column if not exists channel text not null default 'ligacao' check (channel in ('ligacao','whatsapp','email'));
