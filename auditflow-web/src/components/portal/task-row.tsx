"use client";

import { I } from "@/components/ui/icons";
import { Badge, PriorityTag } from "@/components/ui/badge";
import { badgeKind, isOverdue, isReviewable } from "@/lib/status";
import { fmtDate, dueNote } from "@/lib/format";
import type { BadgeKind, PbcItem } from "@/types";

/* status → cor de destaque (faixa lateral) */
const PORTAL_STRIPE: Partial<Record<BadgeKind, string>> = {
  rejeitado: "#E5533C",
  atrasado: "#E5533C",
  vencehoje: "#F0A500",
  pendente: "#F0A500",
  revisao: "#2C7BE5",
  aprovado: "#00C896",
};

function RowAction({ item, onOpen }: { item: PbcItem; onOpen: () => void }) {
  const stop = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpen();
  };
  if (item.status === "REJEITADO")
    return (
      <button
        onClick={stop}
        className="h-8 px-3 rounded-md text-[12.5px] font-medium inline-flex items-center gap-1.5 border bg-white"
        style={{ color: "#E5533C", borderColor: "rgba(229,83,60,0.5)" }}
      >
        <I.refresh size={13} />
        Reenviar
      </button>
    );
  if (item.status === "PENDENTE")
    return (
      <button
        onClick={stop}
        className="h-8 px-3 rounded-md text-[12.5px] font-medium inline-flex items-center gap-1.5 text-white"
        style={{ background: "#0D1F2D" }}
      >
        <I.upload size={13} />
        Anexar
      </button>
    );
  if (isReviewable(item))
    return (
      <button
        onClick={stop}
        className="h-8 px-3 rounded-md text-[12.5px] inline-flex items-center gap-1.5 bg-paper border border-line text-text hover:bg-white"
      >
        Ver envio
      </button>
    );
  return (
    <button
      onClick={stop}
      className="h-8 px-3 rounded-md text-[12.5px] inline-flex items-center gap-1.5 bg-paper border border-line text-sub hover:text-text"
    >
      <I.download size={13} />
      Baixar
    </button>
  );
}

export function TaskRow({
  item,
  onOpen,
  flash,
}: {
  item: PbcItem;
  onOpen: () => void;
  flash: boolean;
}) {
  const kind = badgeKind(item);
  const stripe = PORTAL_STRIPE[kind] || "#6B7280";
  const over = isOverdue(item);
  const hasDue = item.prazo && fmtDate(item.prazo) !== "—";

  let sub: React.ReactNode = null;
  if (item.status === "REJEITADO" && item.motivoRejeicao)
    sub = <span className="text-rust">Comentário: “{item.motivoRejeicao}”</span>;
  else if (isReviewable(item) && item.arquivo) sub = <>Enviado: {item.arquivo.nome}</>;
  else if (item.status === "APROVADO" && item.arquivo) sub = <>{item.arquivo.nome}</>;

  return (
    <tr
      onClick={onOpen}
      className={`row-hover border-b border-line/70 last:border-0 cursor-pointer ${flash ? "flash-row" : ""}`}
    >
      <td className="pl-0 pr-4 py-3.5" style={{ boxShadow: `inset 3px 0 0 ${stripe}` }}>
        <div className="pl-4">
          <div className="text-text font-medium leading-tight">{item.titulo}</div>
          {sub && <div className="text-[11.5px] text-sub mt-0.5 truncate max-w-[40ch]">{sub}</div>}
        </div>
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap">
        {hasDue ? (
          <>
            <div className="tabular-nums text-text">{fmtDate(item.prazo)}</div>
            <div className="text-[11px] mt-0.5" style={{ color: over ? "#E5533C" : "#6B7280" }}>
              {dueNote(item.prazo)}
            </div>
          </>
        ) : (
          <span className="text-sub">—</span>
        )}
      </td>
      <td className="px-4 py-3.5">
        <PriorityTag level={item.prioridade} />
      </td>
      <td className="px-4 py-3.5 badge-tween">
        <Badge kind={kind} />
      </td>
      <td className="px-4 py-3.5 text-right pr-5">
        <RowAction item={item} onOpen={onOpen} />
      </td>
    </tr>
  );
}
