-- Guarda o motivo quando o envio de uma resposta pelo WhatsApp é recusado.
alter table public.whatsapp_mensagens add column if not exists erro text check (erro is null or char_length(erro) <= 300);
