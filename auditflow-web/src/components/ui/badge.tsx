import type { BadgeKind, Prioridade } from "@/types";
import { STATUS } from "@/lib/status";
import { I } from "./icons";

export function Badge({
  kind,
  children,
  dot = true,
  size = "md",
}: {
  kind?: BadgeKind;
  children?: React.ReactNode;
  dot?: boolean;
  size?: "sm" | "md";
}) {
  const s = (kind && STATUS[kind]) || {
    l: children,
    c: "#6B7280",
    b: "rgba(107,114,128,0.14)",
  };
  const pad = size === "sm" ? "px-2 py-0.5 text-[10.5px]" : "px-2.5 py-1 text-[11.5px]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${pad}`}
      style={{ color: s.c, background: s.b }}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.c }} />}
      {children || s.l}
    </span>
  );
}

/* valores do enum do backend → cor e rótulo de exibição */
const PRIORITY_META: Record<Prioridade, { c: string; l: string }> = {
  CRITICA: { c: "#B91C1C", l: "CRÍTICA" },
  ALTA: { c: "#E5533C", l: "ALTA" },
  MEDIA: { c: "#F0A500", l: "MÉDIA" },
  BAIXA: { c: "#6B7280", l: "BAIXA" },
};

export function Priority({ level }: { level: Prioridade }) {
  const meta = PRIORITY_META[level] || PRIORITY_META.BAIXA;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.12em]"
      style={{ color: meta.c }}
    >
      <span className="w-[3px] h-3 rounded-sm" style={{ background: meta.c }} />
      {meta.l}
    </span>
  );
}

/* prioridade como tag com borda — usada no portal do cliente */
export function PriorityTag({ level }: { level: Prioridade }) {
  const meta = PRIORITY_META[level] || PRIORITY_META.BAIXA;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-[0.1em] border bg-white"
      style={{ color: meta.c, borderColor: `${meta.c}66` }}
    >
      <I.flag size={9} />
      {meta.l}
    </span>
  );
}

export function SegmentBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-medium"
      style={{ color: "#4B5563", background: "rgba(107,114,128,0.12)" }}
    >
      {children}
    </span>
  );
}
