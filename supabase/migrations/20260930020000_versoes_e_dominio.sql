-- Histórico de versões do site (últimas 10) e consulta de site por domínio próprio.
create table public.site_versions (
  id bigint generated always as identity primary key,
  site_id bigint not null references public.sites(id) on delete cascade,
  template text, content jsonb not null, created_at timestamptz not null default now()
);
create index site_versions_site_idx on public.site_versions (site_id, id desc);
alter table public.site_versions enable row level security;
create policy "versions_owner" on public.site_versions for select to authenticated
  using (exists (select 1 from public.sites s where s.id = site_id and s.user_id = auth.uid()));

create function public.save_site_version() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.content is distinct from old.content or new.template is distinct from old.template then
    insert into public.site_versions (site_id, template, content) values (old.id, old.template, old.content);
    delete from public.site_versions where site_id = old.id
      and id not in (select id from public.site_versions where site_id = old.id order by id desc limit 10);
  end if;
  return new;
end $$;
revoke all on function public.save_site_version() from public, anon, authenticated;
create trigger sites_versions before update on public.sites for each row execute function public.save_site_version();

create function public.site_slug_by_domain(p_domain text) returns text
language sql stable security definer set search_path = '' as $$
  select slug from public.sites where custom_domain = lower(p_domain) and status = 'publicado'
$$;
revoke all on function public.site_slug_by_domain(text) from public;
grant execute on function public.site_slug_by_domain(text) to anon, authenticated;
