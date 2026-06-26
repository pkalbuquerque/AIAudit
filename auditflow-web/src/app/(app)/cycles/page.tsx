"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { I } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import { Btn } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Topbar } from "@/components/layout/topbar";
import { TableSkeleton, ErrorAlert } from "@/components/ui/skeleton";
import { NewCycleSlideOver } from "@/components/cycles/new-cycle-slide-over";
import { CycleStatusAction } from "@/components/cycles/cycle-status-action";
import { useAuditCycles } from "@/hooks/use-audit-cycles";
import { useAuditClients } from "@/hooks/use-audit-clients";
import { CYCLE_STATUS_VIEW, cyclePeriod } from "@/lib/adapters";
import { handleApiError } from "@/lib/error-handler";
import type { CycleStatusApi } from "@/types/api";

const TABS: { label: string; status: CycleStatusApi | null }[] = [
  { label: "Todos", status: null },
  { label: "Em Andamento", status: "EM_ANDAMENTO" },
  { label: "Abertos", status: "ABERTO" },
  { label: "Encerrados", status: "ENCERRADO" },
];

export default function CyclesPage() {
  const [tab, setTab] = useState(0);
  const [openSlideOver, setOpenSlideOver] = useState(false);
  const [search, setSearch] = useState("");

  const cyclesQ = useAuditCycles();
  const clientsQ = useAuditClients();

  const clientName = useMemo(() => {
    const map = new Map<string, string>();
    (clientsQ.data ?? []).forEach((c) => map.set(c.id, c.nomeEmpresa));
    return (id: string) => map.get(id) ?? "—";
  }, [clientsQ.data]);

  const list = useMemo(() => {
    let rows = cyclesQ.data ?? [];
    const status = TABS[tab].status;
    if (status) rows = rows.filter((c) => c.status === status);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (c) => c.titulo.toLowerCase().includes(q) || clientName(c.auditClientId).toLowerCase().includes(q)
      );
    }
    return rows;
  }, [cyclesQ.data, tab, search, clientName]);

  const active = (cyclesQ.data ?? []).filter((c) => c.status !== "ENCERRADO").length;
  const closed = (cyclesQ.data ?? []).filter((c) => c.status === "ENCERRADO").length;

  return (
    <div>
      <Topbar
        title="Projetos de Auditoria"
        subtitle={
          <>
            Gestão de todos os engajamentos.{" "}
            <span className="text-text font-medium">{active} em curso</span> · {closed} encerrados.
          </>
        }
        action={
          <Btn kind="primary" icon={<I.plus />} onClick={() => setOpenSlideOver(true)}>
            Novo Projeto
          </Btn>
        }
      />

      <div className="px-10 py-6">
        {/* abas + busca */}
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <div className="flex items-center gap-1 border-b border-line">
            {TABS.map((t, i) => (
              <button
                key={t.label}
                onClick={() => setTab(i)}
                className={`relative h-10 px-4 text-[13px] transition-colors ${
                  tab === i ? "text-text" : "text-sub hover:text-text"
                }`}
              >
                {t.label}
                {tab === i && <span className="absolute left-3 right-3 -bottom-px h-0.5 bg-ink-900" />}
              </button>
            ))}
          </div>
          <div className="relative">
            <I.search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sub" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente ou projeto…"
              className="h-9 w-[280px] pl-9 pr-3 bg-white border border-line rounded-md text-[12.5px] placeholder:text-sub focus:border-ink-900 outline-none"
            />
          </div>
        </div>

        {cyclesQ.isLoading && <TableSkeleton rows={5} cols={6} />}
        {cyclesQ.isError && (
          <ErrorAlert message={handleApiError(cyclesQ.error)} onRetry={() => cyclesQ.refetch()} />
        )}

        {cyclesQ.isSuccess && (
          <div className="bg-white border border-line rounded-lg overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] tracking-[0.14em] uppercase text-sub border-b border-line bg-paper/40">
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Nome do projeto</th>
                  <th className="px-5 py-3 font-medium">Período</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Progresso</th>
                  <th className="px-5 py-3 font-medium text-right pr-6">Ações</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c, i) => {
                  const view = CYCLE_STATUS_VIEW[c.status];
                  const name = clientName(c.auditClientId);
                  return (
                    <tr key={c.id} className="row-hover border-b border-line/70 last:border-0">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-9 h-9 rounded-md flex items-center justify-center font-display text-[15px] text-ink-900"
                            style={{
                              background: ["#E7EFE4", "#E2ECF6", "#F2EAE0", "#EFE4EC", "#E3EBE7"][i % 5],
                            }}
                          >
                            {name[0] ?? "—"}
                          </span>
                          <div>
                            <div className="text-text font-medium">{name}</div>
                            <div className="text-[11px] text-sub">{c.tipo ?? "Auditoria"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-text">{c.titulo}</td>
                      <td className="px-5 py-4 text-sub tabular-nums">
                        {cyclePeriod(c.dataInicio, c.dataFim)}
                      </td>
                      <td className="px-5 py-4">
                        <Badge kind={view} />
                      </td>
                      <td className="px-5 py-4">
                        <Progress
                          value={Math.round(c.progressoPercent ?? 0)}
                          color={
                            view === "encerrado" ? "#0A8F6A" : view === "planejamento" ? "#6B7280" : "#0D1F2D"
                          }
                        />
                      </td>
                      <td className="px-5 py-4 text-right pr-5">
                        <div className="inline-flex items-center gap-1.5">
                          <CycleStatusAction cycleId={c.id} status={c.status} />
                          <Link
                            href={`/pbc?cycleId=${c.id}`}
                            className="h-8 px-3 rounded-md border border-line bg-white text-text text-[12px] inline-flex items-center hover:bg-paper"
                          >
                            Abrir
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!list.length && (
                  <tr>
                    <td colSpan={6} className="px-6 py-14 text-center text-sub text-[13px]">
                      Nenhum projeto encontrado. Crie o primeiro em “Novo Projeto”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {openSlideOver && <NewCycleSlideOver onClose={() => setOpenSlideOver(false)} />}
    </div>
  );
}
