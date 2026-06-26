"use client";

import { useDashboardSummary } from "@/hooks/use-dashboard";
import { Skeleton } from "@/components/ui/skeleton";

/* Donut leve + legenda — distribuição real de GET /api/dashboard (itensPorStatus) */
export function DonutLegend({ firm }: { firm?: boolean }) {
  const { data, isLoading } = useDashboardSummary();

  if (isLoading) return <Skeleton className="h-[148px] mt-1" />;

  const por = data?.itensPorStatus ?? {};
  const segs = [
    { label: "Aprovados", v: por.APROVADO ?? 0, c: "#00C896" },
    { label: "Pendentes", v: por.PENDENTE ?? 0, c: "#F0A500" },
    { label: "Em revisão", v: por.EM_REVISAO ?? 0, c: "#2C7BE5" },
    { label: "Rejeitados", v: por.REJEITADO ?? 0, c: "#E5533C" },
  ];
  const total = segs.reduce((a, s) => a + s.v, 0);
  const R = 56;
  const C = 2 * Math.PI * R;
  let off = 0;
  return (
    <div className="flex items-center gap-6 mt-1">
      <svg width="148" height="148" viewBox="0 0 148 148">
        <circle cx="74" cy="74" r={R} fill="none" stroke="#F4F6F8" strokeWidth="18" />
        {total > 0 &&
          segs.map((s, i) => {
            const len = (s.v / total) * C;
            const el = (
              <circle
                key={i}
                cx="74"
                cy="74"
                r={R}
                fill="none"
                stroke={s.c}
                strokeWidth="18"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-off}
                transform="rotate(-90 74 74)"
                strokeLinecap="butt"
              />
            );
            off += len;
            return el;
          })}
        <text x="74" y="72" textAnchor="middle" className="font-display" style={{ fontSize: 26, fill: "#0D1F2D" }}>
          {total}
        </text>
        <text x="74" y="90" textAnchor="middle" style={{ fontSize: 10, fill: "#6B7280", letterSpacing: 1.5 }}>
          {firm ? "FIRMA" : "ITENS"}
        </text>
      </svg>
      <ul className="flex-1 flex flex-col gap-2">
        {segs.map((s, i) => (
          <li key={i} className="flex items-center justify-between text-[12.5px]">
            <span className="flex items-center gap-2.5 text-text">
              <span className="w-2 h-2 rounded-sm" style={{ background: s.c }} />
              {s.label}
            </span>
            <span className="tabular-nums text-sub">{s.v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
