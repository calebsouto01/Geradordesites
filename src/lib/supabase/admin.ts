import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Chave de serviço: SOMENTE no servidor (webhook de cobrança, leitura de denúncias). Nunca use em componente de cliente.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } });
}
