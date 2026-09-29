-- Imagens enviadas no chat de criação (logo, fotos, prints). Modo sem login: envio anônimo liberado, leitura pública.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('uploads', 'uploads', true, 5242880, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

create policy "uploads_insert" on storage.objects for insert to anon, authenticated with check (bucket_id = 'uploads');
create policy "uploads_select" on storage.objects for select to anon, authenticated using (bucket_id = 'uploads');
