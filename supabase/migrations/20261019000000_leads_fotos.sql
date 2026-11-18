-- Referências das fotos do Google de cada lead (só os nomes; null = ainda não buscou, [] = o lugar não tem fotos).
alter table public.leads add column if not exists photos jsonb;
