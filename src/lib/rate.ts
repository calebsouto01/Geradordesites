import type { SupabaseClient } from "@supabase/supabase-js";

export const clientIp = (req: Request) => (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "desconhecido";

// true = dentro do limite. Contador no banco (funciona em serverless, sem infraestrutura extra).
// Falha do contador não derruba o serviço.
export async function allowUser(supabase: SupabaseClient, name: string, limit: number, windowSec: number) {
  const { data, error } = await supabase.rpc("hit_rate_user", { p_name: name, p_limit: limit, p_window: windowSec });
  return error ? true : Boolean(data);
}

export async function allowIp(supabase: SupabaseClient, name: string, req: Request, limit: number, windowSec: number) {
  const { data, error } = await supabase.rpc("hit_rate_ip", { p_name: name, p_ip: clientIp(req), p_limit: limit, p_window: windowSec });
  return error ? true : Boolean(data);
}

export const tooMany = () => Response.json({ error: "Muitas requisições. Aguarde um instante e tente de novo." }, { status: 429 });
