-- Referências das fotos do Google por resultado de busca (só os nomes; a imagem é buscada na hora de exibir).
alter table public.search_results add column if not exists photos jsonb;
