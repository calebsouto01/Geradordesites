import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente anônimo, sem cookies: para páginas públicas (sites) e funções abertas com limite próprio no banco.
export const createAnonClient = () =>
  createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
