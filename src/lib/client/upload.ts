const toBase64 = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1] ?? ""); r.onerror = rej; r.readAsDataURL(f); });

export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

// Envia logo ou foto ao servidor (que valida o arquivo e guarda na pasta do usuário).
export async function uploadImage(file: File, kind: "logo" | "foto"): Promise<{ url?: string; accent?: string; error?: string }> {
  if (!IMAGE_TYPES.includes(file.type)) return { error: "Envie uma imagem PNG, JPG ou WebP." };
  if (file.size > 5 * 1024 * 1024) return { error: "A imagem deve ter até 5 MB." };
  const res = await fetch("/api/sites/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, mediaType: file.type, data: await toBase64(file) }) });
  const json = await res.json().catch(() => ({}));
  return res.ok ? { url: json.url, accent: json.theme?.accent } : { error: json.error ?? "Erro ao enviar a imagem." };
}
