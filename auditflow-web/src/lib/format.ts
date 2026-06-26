/* Helpers de data/formatação — agora usando a data real do sistema
   (o "relógio de demonstração" foi removido junto com os mocks). */

const MS_DAY = 86_400_000;

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function todayIso(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Data mínima dos inputs de prazo (hoje). */
export const MIN_DATE_ISO = todayIso();

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function daysLeft(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const due = new Date(iso.slice(0, 10) + "T00:00:00");
  return Math.round((due.getTime() - startOfToday().getTime()) / MS_DAY);
}

export function dueNote(iso: string | null | undefined): string {
  const d = daysLeft(iso);
  if (d === null) return "";
  if (d < 0) return `${Math.abs(d)} ${Math.abs(d) === 1 ? "dia" : "dias"} de atraso`;
  if (d === 0) return "vence hoje";
  return `${d} ${d === 1 ? "dia restante" : "dias restantes"}`;
}

export function relTime(ts: number | null | undefined): string {
  if (!ts) return "";
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 45) return "agora";
  const m = Math.round(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return `há ${d} ${d === 1 ? "dia" : "dias"}`;
}

/** Converte LocalDateTime ISO do backend em epoch ms (para relTime). */
export function tsFromIso(iso: string | null | undefined): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export function fmtBytes(bytes: number | null | undefined): string {
  if (bytes == null || bytes <= 0) return "";
  if (bytes >= 1_048_576) return (bytes / 1_048_576).toFixed(1) + " MB";
  return Math.max(1, Math.round(bytes / 1024)) + " KB";
}
