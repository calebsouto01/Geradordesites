-- Contatos que não foram alcançados por telefone e serão abordados pessoalmente.
alter table public.leads drop constraint leads_local_check;
alter table public.leads add constraint leads_local_check check (local in ('prospeccao','retorno','armazenado','visita','sites','descartado'));
alter table public.leads add column motivo_visita text check (motivo_visita is null or motivo_visita in ('telefone_indisponivel','numero_errado','sem_resposta'));
