"use client";

/* Portal do Cliente — GET /api/portal/items · Fluxo 2 (upload + envio) */

import { useMemo, useState } from "react";
import { I } from "@/components/ui/icons";
import { SelectField } from "@/components/ui/form";
import { ClientHeader } from "@/components/portal/client-header";
import { ClientSummary } from "@/components/portal/client-summary";
import { TaskRow } from "@/components/portal/task-row";
import { TaskDetailSlideOver } from "@/components/portal/task-detail-slide-over";
import { TableSkeleton, ErrorAlert } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { usePortalItems } from "@/hooks/use-cliente-portal";
import { toViewPbcItem } from "@/lib/adapters";
import { handleApiError } from "@/lib/error-handler";
import { badgeKind, isActionableByClient, isReviewable } from "@/lib/status";
import { daysLeft } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";

export type PortalFilter = "todas" | "pendentes" | "rejeitadas" | "revisao";

export default function ClientPortalPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<PortalFilter>("todas");
  const [sort, setSort] = useState("Prazo");
  const [openId, setOpenId] = useState<string | null>(null);

  const itemsQ = usePortalItems();
  const all = useMemo(
    () =>
      (itemsQ.data ?? []).map((r, i) =>
        toViewPbcItem(r, { index: i, responsavelNome: user?.nome, responsavelEmail: user?.email })
      ),
    [itemsQ.data, user?.nome, user?.email]
  );

  const firstName = (user?.nome ?? "").split(" ")[0] || "—";
  const actionableCount = all.filter(isActionableByClient).length;

  const counts: Record<PortalFilter, number> = {
    todas: all.length,
    pendentes: all.filter((t) => t.status === "PENDENTE").length,
    rejeitadas: all.filter((t) => t.status === "REJEITADO").length,
    revisao: all.filter(isReviewable).length,
  };
  const pills: { key: PortalFilter; label: string }[] = [
    { key: "todas", label: "Todas" },
    { key: "pendentes", label: "Pendentes" },
    { key: "rejeitadas", label: "Rejeitadas" },
    { key: "revisao", label: "Em Revisão" },
  ];

  let list = all;
  if (filter === "pendentes") list = all.filter((t) => t.status === "PENDENTE");
  else if (filter === "rejeitadas") list = all.filter((t) => t.status === "REJEITADO");
  else if (filter === "revisao") list = all.filter(isReviewable);

  const sorted = useMemo(() => {
    const arr = [...list];
    if (sort === "Prazo") {
      arr.sort((a, b) => (daysLeft(a.prazo) ?? 9999) - (daysLeft(b.prazo) ?? 9999));
    } else if (sort === "Prioridade") {
      const o: Record<string, number> = { CRITICA: 0, ALTA: 1, MEDIA: 2, BAIXA: 3 };
      arr.sort((a, b) => (o[a.prioridade] ?? 9) - (o[b.prioridade] ?? 9));
    } else if (sort === "Status") {
      const o: Record<string, number> = {
        rejeitado: 0,
        atrasado: 1,
        vencehoje: 2,
        pendente: 3,
        revisao: 4,
        aprovado: 5,
      };
      arr.sort((a, b) => (o[badgeKind(a)] ?? 9) - (o[badgeKind(b)] ?? 9));
    }
    return arr;
  }, [list, sort]);

  const current = openId ? all.find((i) => i.id === openId) : null;

  return (
    <div className="min-h-screen bg-paper">
      <ClientHeader />

      <main className="max-w-[1180px] mx-auto px-8 pt-7 pb-14">
        {/* hero compacto */}
        <div className="flex items-center gap-3.5">
          <Avatar name={user?.nome ?? "—"} size={42} tone="#7E3AF2" />
          <div>
            <h1 className="font-display text-[24px] leading-tight text-text">Olá, {firstName}</h1>
            <p className="text-[13px] text-sub mt-0.5">
              {actionableCount > 0 ? (
                <>
                  Você tem{" "}
                  <span className="text-text font-medium">
                    {actionableCount} {actionableCount === 1 ? "tarefa" : "tarefas"}
                  </span>{" "}
                  {actionableCount === 1 ? "que precisa" : "que precisam"} da sua atenção.
                </>
              ) : (
                <>Está tudo em dia por aqui. 🎉</>
              )}
            </p>
          </div>
        </div>

        {itemsQ.isLoading && (
          <div className="mt-6">
            <TableSkeleton rows={5} cols={4} />
          </div>
        )}
        {itemsQ.isError && (
          <div className="mt-6">
            <ErrorAlert message={handleApiError(itemsQ.error)} onRetry={() => itemsQ.refetch()} />
          </div>
        )}

        {itemsQ.isSuccess && (
          <>
            <ClientSummary items={all} filter={filter} setFilter={setFilter} />

            {/* barra: pills + ordenação */}
            <div className="mt-7 flex items-center justify-between gap-4 flex-wrap mb-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {pills.map((p) => {
                  const is = filter === p.key;
                  return (
                    <button
                      key={p.key}
                      onClick={() => setFilter(p.key)}
                      className={`h-9 px-3.5 rounded-full text-[12.5px] inline-flex items-center gap-2 border transition-colors ${
                        is ? "bg-ink-900 text-white border-ink-900" : "bg-white text-text border-line hover:bg-paper"
                      }`}
                    >
                      {p.label}
                      <span
                        className={`text-[10.5px] tabular-nums px-1.5 rounded-full ${
                          is ? "bg-white/15 text-white" : "bg-paper text-sub"
                        }`}
                      >
                        {counts[p.key]}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 text-[12.5px] text-sub shrink-0">
                <span>Ordenar por:</span>
                <div className="w-[140px]">
                  <SelectField
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    options={["Prazo", "Status", "Prioridade"]}
                  />
                </div>
              </div>
            </div>

            {/* tabela compacta */}
            <div className="bg-white border border-line rounded-lg overflow-hidden">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[11px] tracking-[0.14em] uppercase text-sub border-b border-line bg-paper/40">
                    <th className="pl-4 pr-4 py-3 font-medium">Tarefa</th>
                    <th className="px-4 py-3 font-medium w-[150px]">Prazo</th>
                    <th className="px-4 py-3 font-medium w-[110px]">Prioridade</th>
                    <th className="px-4 py-3 font-medium w-[140px]">Status</th>
                    <th className="px-4 py-3 font-medium text-right pr-5 w-[130px]">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((t) => (
                    <TaskRow key={t.id} item={t} flash={false} onOpen={() => setOpenId(t.id)} />
                  ))}
                  {!sorted.length && (
                    <tr>
                      <td colSpan={5} className="px-6 py-14 text-center text-sub text-[13px]">
                        Nenhuma tarefa neste filtro. Bom trabalho.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 text-[12px] text-sub">
              Mostrando <span className="text-text">{sorted.length}</span> de {all.length} tarefas ·
              clique numa linha para anexar o documento e enviar para revisão.
            </div>
          </>
        )}

        <footer className="mt-10 pt-6 border-t border-line flex items-center justify-between text-[11.5px] text-sub flex-wrap gap-3">
          <span className="inline-flex items-center gap-2">
            <I.shield size={13} />
            AuditFlow · ambiente seguro
          </span>
          <div className="flex items-center gap-4">
            <a className="hover:text-text cursor-pointer">Suporte</a>
            <a className="hover:text-text cursor-pointer">Termos</a>
            <a className="hover:text-text cursor-pointer">Privacidade</a>
          </div>
        </footer>
      </main>

      {current && <TaskDetailSlideOver item={current} onClose={() => setOpenId(null)} />}
    </div>
  );
}
