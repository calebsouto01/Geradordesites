-- Agenda do vendedor: reuniões de apresentação, retornos e follow-ups ligados aos leads.
create table public.agenda_items (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lead_id bigint references public.leads(id) on delete set null,
  kind text not null default 'reuniao' check (kind in ('reuniao','retorno','followup','outro')),
  title text not null check (char_length(title) between 1 and 120),
  notes text check (notes is null or char_length(notes) <= 1000),
  starts_at timestamptz not null,
  duration_min smallint not null default 30 check (duration_min between 5 and 480),
  done_at timestamptz,
  created_at timestamptz not null default now()
);
create index agenda_items_user_idx on public.agenda_items (user_id, starts_at);
create index agenda_items_lead_idx on public.agenda_items (lead_id);
alter table public.agenda_items enable row level security;
create policy agenda_own on public.agenda_items for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.agenda_items from anon;
