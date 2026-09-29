import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Modo sem login: cliente anônimo, sem sessão.
export const createClient = () =>
  createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
