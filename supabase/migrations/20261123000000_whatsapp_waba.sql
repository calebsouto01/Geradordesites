-- Conta do WhatsApp Business (WABA) devolvida pelo Cadastro Incorporado da Meta.
alter table public.agente_whatsapp add column if not exists waba_id text check (waba_id is null or waba_id ~ '^[0-9]{5,30}$');
grant select (waba_id) on public.agente_whatsapp to authenticated;
