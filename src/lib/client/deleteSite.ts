import type { SupabaseClient } from "@supabase/supabase-js";

// Exclui o site (e, por cascata, versões, visitas e mensagens do formulário). O contato não é apagado:
// se ele estava em "Encaminhar proposta" só por causa do site, volta para "Criar prévia do site".
export async function deleteSite(supabase: SupabaseClient, site: { id: number; lead_id: number; status: string }, name: string): Promise<boolean> {
  const aviso = site.status === "publicado"
    ? `O site de "${name}" está PUBLICADO. Excluir tira o endereço do ar e apaga versões, visitas e mensagens do formulário. Não dá para desfazer. Excluir mesmo?`
    : `Excluir o site de "${name}"? Isso apaga a prévia, as versões e as visitas. Não dá para desfazer.`;
  if (!confirm(aviso)) return false;
  const { error } = await supabase.from("sites").delete().eq("id", site.id);
  if (error) { alert("Não foi possível excluir o site."); return false; }
  await supabase.from("leads").update({ stage: "novo" }).eq("id", site.lead_id).eq("stage", "qualificado");
  return true;
}
