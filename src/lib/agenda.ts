export type AgendaKind = "reuniao" | "retorno" | "followup" | "outro";
export type AgendaItem = {
  id: number; lead_id: number | null; kind: AgendaKind; title: string; notes: string | null;
  starts_at: string; duration_min: number; done_at: string | null;
};

export const KINDS: Record<AgendaKind, { label: string; icon: string }> = {
  reuniao: { label: "Reunião de apresentação", icon: "🤝" },
  retorno: { label: "Retorno de ligação", icon: "📞" },
  followup: { label: "Follow-up", icon: "✉️" },
  outro: { label: "Outro", icon: "📌" },
};

// "AAAA-MM-DD" + "HH:MM" no horário do navegador -> ISO (o banco guarda com fuso).
export const startsAt = (date: string, time = "09:00") => new Date(`${date}T${time}`).toISOString();

export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const timeOf = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

// Link para adicionar o compromisso ao Google Agenda (sem integração de conta).
export function googleCalendarUrl(i: AgendaItem, leadName?: string) {
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const start = new Date(i.starts_at), end = new Date(start.getTime() + i.duration_min * 60000);
  const q = new URLSearchParams({ action: "TEMPLATE", text: i.title, dates: `${f(start)}/${f(end)}`, details: [leadName, i.notes].filter(Boolean).join("\n") });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}
