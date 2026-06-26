"use client";

import { I, type IconComponent } from "@/components/ui/icons";
import { isOverdue, isReviewable } from "@/lib/status";
import { daysLeft } from "@/lib/format";
import type { PbcItem } from "@/types";
import type { PortalFilter } from "@/app/portal/page";

function Tile({
  label,
  value,
  Ic,
  accent,
  hot,
  onClick,
  active,
}: {
  label: string;
  value: number;
  Ic: IconComponent;
  accent: string;
  hot?: boolean;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-lg px-4 py-3.5 border flex items-center gap-3.5 transition-all"
      style={{
        background: hot ? "rgba(229,83,60,0.06)" : "#FFFFFF",
        borderColor: hot ? "rgba(229,83,60,0.45)" : "#E2E8F0",
        ...(active
          ? { boxShadow: `0 0 0 2px ${hot ? "rgba(229,83,60,0.35)" : "rgba(13,31,45,0.12)"}` }
          : {}),
      }}
    >
      <span
        className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
        style={{ background: `${accent}1f`, color: accent }}
      >
        <Ic size={18} />
      </span>
      <div className="min-w-0">
        <div
          className="font-display text-[28px] leading-none tabular-nums"
          style={{ color: hot ? "#E5533C" : "#0D1F2D" }}
        >
          {value}
        </div>
        <div className="text-[11.5px] mt-1" style={{ color: hot ? "#B43A28" : "#6B7280" }}>
          {label}
        </div>
      </div>
    </button>
  );
}

export function ClientSummary({
  items,
  filter,
  setFilter,
}: {
  items: PbcItem[];
  filter: PortalFilter;
  setFilter: (f: PortalFilter) => void;
}) {
  const late = items.filter(isOverdue).length;
  const soon = items.filter((t) => {
    const d = daysLeft(t.prazo);
    return t.status === "PENDENTE" && d !== null && d >= 0 && d <= 7;
  }).length;
  const review = items.filter(isReviewable).length;
  const lateHot = late > 0;

  return (
    <div className="grid grid-cols-4 gap-3 mt-5">
      <Tile
        label="Tarefas no projeto"
        value={items.length}
        Ic={I.list}
        accent="#1A3A4A"
        onClick={() => setFilter("todas")}
        active={filter === "todas"}
      />
      <Tile
        label="Vencimento próximo"
        value={soon}
        Ic={I.clock}
        accent="#B47600"
        onClick={() => setFilter("pendentes")}
        active={filter === "pendentes"}
      />
      <Tile
        label="Em revisão"
        value={review}
        Ic={I.refresh}
        accent="#1F5FB4"
        onClick={() => setFilter("revisao")}
        active={filter === "revisao"}
      />
      <Tile
        label="Atrasadas"
        value={late}
        Ic={I.alert}
        accent="#E5533C"
        hot={lateHot}
        onClick={() => setFilter("pendentes")}
        active={false}
      />
    </div>
  );
}
