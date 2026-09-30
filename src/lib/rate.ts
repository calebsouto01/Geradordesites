import type { SupabaseClient } from "@supabase/supabase-js";

export const clientIp = (req: Request) => (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "desconhecido";

// true = dentro do limite. Contador no banco (funciona em serverless, sem infraestrutura extra).
export async function allow(supabase: SupabaseClient, name: string, id: string, limit: number, windowSec: number) {
  const { data, error } = await supabase.rpc("hit_rate", { p_key: `${name}:${id}`, p_limit: limit, p_window: windowSec });
  if (error) return true; // falha do contador não derruba o serviço
  return Boolean(data);
}

export const tooMany = () => Response.json({ error: "Muitas requisições. Aguarde um instante e tente de novo." }, { status: 429 });
