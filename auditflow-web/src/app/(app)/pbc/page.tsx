"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { I } from "@/components/ui/icons";
import { Badge, Priority } from "@/components/ui/badge";
import { Btn, type BtnKind } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Topbar } from "@/components/layout/topbar";
import { TableSkeleton, ErrorAlert } from "@/components/ui/skeleton";
import { PbcDetailModal } from "@/components/pbc/pbc-detail-modal";
import { CreatePbcSlideOver } from "@/components/pbc/create-pbc-slide-over";
import { useAuditCycles } from "@/hooks/use-audit-cycles";
import { useAuditClients } from "@/hooks/use-audit-clients";
import { usePbcItems } from "@/hooks/use-pbc-items";
import { toViewPbcItem } from "@/lib/adapters";
import { handleApiError } from "@/lib/error-handler";
import { badgeKind, isOverdue, isReviewable } from "@/lib/status";
import { fmtDate, dueNote } from "@/lib/format";
import type { PbcItem } from "@/types";

const CHIPS = ["Todos", "Pendentes", "Em Revisão", "Aprovados", "Atrasados"] as const;
type Chip = (typeof CHIPS)[number];

function PbcListContent() {
  const searchParams = useSearchParams();
  const [cycleId, setCycleId] = useState<string | null>(searchParams.get("cycleId"));
  const [filter, setFilter] = useState<Chip>("Todos");
  const [openId, setOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");

  const cyclesQ = useAuditCycles();
  const clientsQ = useAuditClients();

  // sem ciclo na URL → seleciona o primeiro não-encerrado (ou o primeiro)
  useEffect(() => {
    if (!cycleId && cyclesQ.data?.length) {
      const preferred = cyclesQ.data.find((c) => c.status !== "ENCERRADO") ?? cyclesQ.data[0];
      setCycleId(preferred.id);
    }
  }, [cycleId, cyclesQ.data]);

  const cycle = (cyclesQ.data ?? []).find((c) => c.id === cycleId) ?? null;
  const clientName = cycle
    ? (clientsQ.data ?? []).find((cl) => cl.id === cycle.auditClientId)?.nomeEmpresa ?? ""
    : "";

  const itemsQ = usePbcItems(cycleId);

  const items: PbcItem[] = useMemo(
    () => (itemsQ.data ?? []).map((r, i) => toViewPbcItem(r, { index: i, clientName })),
    [itemsQ.data, clientName]
  );

  const counts: Record<Chip, number> = {
    Todos: items.length,
    Pendentes: items.filter((r) => badgeKind(r) === "pendente" || badgeKind(r) === "vencehoje").length,
    "Em Revisão": items.filter((r) => isReviewable(r)).length,
    Aprovados: items.filter((r) => r.status === "APROVADO").length,
    Atrasados: items.filter((r) => isOverdue(r)).length,
  };

  const filtered = useMemo(() => {
    let rows = items;
    if (filter !== "Todos") {
      rows = rows.filter((r) => {
        const k = badgeKind(r);
        if (filter === "Pendentes") return k === "pendente" || k === "vencehoje";
        if (filter === "Em Revisão") return isReviewable(r);
        if (filter === "Aprovados") return r.status === "APROVADO";
        if (filter === "Atrasados") return isOverdue(r);
        return true;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => r.titulo.toLowerCase().includes(q));
    }
    return rows;
  }, [items, filter, search]);

  const openItem = openId ? items.find((i) => i.id === openId) : null;

  return (
    <div>
      <Topbar
        breadcrumb={["Projetos", clientName || "—", cycle?.titulo ?? "—", "Lista PBC"]}
        title={cycle ? `Lista PBC — ${cycle.titulo}` : "Lista PBC"}
        subtitle={
          <>
            <span className="text-text font-medium">{clientName || "Selecione um projeto"}</span> ·{" "}
            {items.length} itens · {counts.Aprovados} aprovados · {counts.Pendentes} pendentes ·{" "}
            {counts["Em Revisão"]} em revisão
          </>
        }
        action={
          <Btn
            kind="primary"
            icon={<I.plus />}
            onClick={() => setCreateOpen(true)}
            disabled={!cycleId}
          >
            Adicionar Item
          </Btn>
        }
      />

      <div className="px-10 py-6">
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          {/* seletor de ciclo */}
          <div className="relative">
            <select
              value={cycleId ?? ""}
              onChange={(e) => {
                setCycleId(e.target.value || null);
                setFilter("Todos");
              }}
              className="h-10 pl-3 pr-9 rounded-md border border-line bg-white text-[13px] text-text outline-none focus:border-ink-900 appearance-none cursor-pointer min-w-[260px]"
            >
              {cyclesQ.isLoading && <option value="">Carregando projetos…</option>}
              {!cyclesQ.isLoading && !(cyclesQ.data ?? []).length && (
                <option value="">Nenhum projeto cadastrado</option>
              )}
              {(cyclesQ.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.titulo}
                </option>
              ))}
            </select>
            <I.chevD size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-sub pointer-events-none" />
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-line rounded-md p-1">
            {CHIPS.map((c) => {
              const is = filter === c;
              return (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  className={`px-3 h-8 rounded text-[12.5px] flex items-center gap-2 transition-colors ${
                    is ? "bg-ink-900 text-white" : "text-text hover:bg-paper"
                  }`}
                >
                  {c}
                  <span
                    className={`text-[10.5px] tabular-nums px-1.5 rounded ${
                      is ? "bg-white/15 text-white" : "bg-paper text-sub"
                    }`}
                  >
                    {counts[c]}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex-1 max-w-[360px] relative">
            <I.search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sub" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar item…"
              className="w-full h-10 pl-9 pr-3 bg-white border border-line rounded-md text-[13px] placeholder:text-sub focus:border-ink-900 outline-none"
            />
          </div>
        </div>

        {(itemsQ.isLoading || (cyclesQ.isLoading && !cycleId)) && <TableSkeleton rows={6} cols={6} />}
        {itemsQ.isError && (
          <ErrorAlert message={handleApiError(itemsQ.error)} onRetry={() => itemsQ.refetch()} />
        )}
        {cyclesQ.isSuccess && !(cyclesQ.data ?? []).length && (
          <div className="bg-white border border-dashed border-line rounded-lg p-12 text-center text-sub text-[13px]">
            Crie um projeto de auditoria para começar a lista PBC.
          </div>
        )}

        {itemsQ.isSuccess && (
          <>
            <div className="bg-white border border-line rounded-lg overflow-hidden">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[11px] tracking-[0.14em] uppercase text-sub border-b border-line bg-paper/40">
                    <th className="px-4 py-3 font-medium w-[44px]">#</th>
                    <th className="px-4 py-3 font-medium">Descrição do item</th>
                    <th className="px-4 py-3 font-medium">Responsável</th>
                    <th className="px-4 py-3 font-medium">Prazo</th>
                    <th className="px-4 py-3 font-medium">Prioridade</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right pr-5">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const over = isOverdue(r);
                    const lastNote = r.status === "REJEITADO" ? r.motivoRejeicao : null;
                    return (
                      <tr
                        key={r.id}
                        className="row-hover border-b border-line/70 last:border-0 cursor-pointer"
                        onClick={() => setOpenId(r.id)}
                      >
                        <td className="px-4 py-4 text-sub tabular-nums">{String(r.n).padStart(2, "0")}</td>
                        <td className="px-4 py-4">
                          <div className="text-text font-medium">{r.titulo}</div>
                          {lastNote && (
                            <div className="text-[11.5px] text-sub mt-0.5 truncate max-w-[42ch]">
                              Último comentário: “{lastNote}”
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={r.responsavel.nome} size={26} />
                            <div className="leading-tight">
                              <div className="text-text">{r.responsavel.nome}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="tabular-nums text-text">{fmtDate(r.prazo)}</div>
                          {over && (
                            <div className="text-[11px] mt-0.5" style={{ color: "#E5533C" }}>
                              {dueNote(r.prazo)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <Priority level={r.prioridade} />
                        </td>
                        <td className="px-4 py-4 badge-tween">
                          <Badge kind={badgeKind(r)} />
                        </td>
                        <td className="px-4 py-4 text-right pr-3">
                          <RowActions row={r} onOpen={() => setOpenId(r.id)} />
                        </td>
                      </tr>
                    );
                  })}
                  {!filtered.length && (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center text-sub text-[13px]">
                        {items.length
                          ? "Nenhum item corresponde aos filtros."
                          : "Este projeto ainda não tem itens PBC."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 text-[12px] text-sub">
              Mostrando <span className="text-text">{filtered.length}</span> de {items.length} itens
            </div>
          </>
        )}
      </div>

      {openItem && <PbcDetailModal item={openItem} onClose={() => setOpenId(null)} />}
      {createOpen && cycleId && (
        <CreatePbcSlideOver
          cycleId={cycleId}
          auditClientId={cycle?.auditClientId}
          clientName={clientName}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </div>
  );
}

export default function PbcListPage() {
  return (
    <Suspense fallback={null}>
      <PbcListContent />
    </Suspense>
  );
}

function RowActions({ row, onOpen }: { row: PbcItem; onOpen: () => void }) {
  let buttons: { label: string; kind: BtnKind; icon?: JSX.Element }[];
  if (isReviewable(row)) buttons = [{ label: "Revisar", kind: "accent", icon: <I.arrowR /> }];
  else if (isOverdue(row))
    buttons = [
      { label: "Cobrar", kind: "danger", icon: <I.send /> },
      { label: "Ver", kind: "subtle" },
    ];
  else if (row.status === "APROVADO") buttons = [{ label: "Ver", kind: "ghost" }];
  else buttons = [{ label: "Ver detalhes", kind: "subtle" }];
  return (
    <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      {buttons.map((b, i) => (
        <Btn key={i} kind={b.kind} size="sm" icon={b.icon} onClick={onOpen}>
          {b.label}
        </Btn>
      ))}
    </div>
  );
}
