"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import { I } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Topbar, TopbarChrome, SectionTitle } from "@/components/layout/topbar";
import { Skeleton, ErrorAlert } from "@/components/ui/skeleton";
import { MetricCard } from "./metric-card";
import { useAuth } from "@/contexts/auth-context";
import { useDashboardSummary } from "@/hooks/use-dashboard";
import { useAuditCycles } from "@/hooks/use-audit-cycles";
import { useAuditClients } from "@/hooks/use-audit-clients";
import { queryKeys } from "@/hooks/query-keys";
import { pbcItemsService } from "@/services/pbc-items.service";
import { toViewPbcItem, CYCLE_STATUS_VIEW } from "@/lib/adapters";
import { handleApiError } from "@/lib/error-handler";
import { isOverdue, isReviewable } from "@/lib/status";
import { dueNote, fmtDate, relTime } from "@/lib/format";
import type { PbcItem } from "@/types";

function todayGreeting(): string {
  const s = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function DashboardAuditor() {
  const { user } = useAuth();
  const dashboardQ = useDashboardSummary();
  const cyclesQ = useAuditCycles();
  const clientsQ = useAuditClients();

  const activeCycles = useMemo(
    () => (cyclesQ.data ?? []).filter((c) => c.status !== "ENCERRADO"),
    [cyclesQ.data]
  );

  const clientName = useMemo(() => {
    const map = new Map<string, string>();
    (clientsQ.data ?? []).forEach((c) => map.set(c.id, c.nomeEmpresa));
    return (id: string) => map.get(id) ?? "—";
  }, [clientsQ.data]);

  // itens dos ciclos ativos (alimenta fila de revisão + itens críticos)
  const itemQueries = useQueries({
    queries: activeCycles.map((c) => ({
      queryKey: queryKeys.pbcItems(c.id),
      queryFn: () => pbcItemsService.list(c.id),
      staleTime: 60_000,
    })),
  });

  const allItems: PbcItem[] = useMemo(
    () =>
      itemQueries.flatMap((q, ix) =>
        (q.data ?? []).map((r, i) =>
          toViewPbcItem(r, { index: i, clientName: clientName(activeCycles[ix].auditClientId) })
        )
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itemQueries.map((q) => q.dataUpdatedAt).join(","), activeCycles, clientName]
  );

  const queue = allItems
    .filter(isReviewable)
    .sort((a, b) => (a.arquivo?.dataUpload || 0) - (b.arquivo?.dataUpload || 0));
  const overdue = allItems.filter(isOverdue);

  const d = dashboardQ.data;
  const reviewN = d?.filaRevisao ?? queue.length;

  return (
    <div>
      <Topbar
        perfil="auditor"
        greeting={todayGreeting()}
        title="Meu Painel"
        subtitle={
          <>
            <span className="font-medium text-text">{user?.nome}</span> ·{" "}
            {(clientsQ.data ?? []).length} clientes ·{" "}
            {reviewN} {reviewN === 1 ? "item aguarda" : "itens aguardam"} sua revisão
          </>
        }
        action={
          <Link
            href="/cycles"
            className="h-10 px-4 rounded-md text-[13px] font-medium inline-flex items-center gap-2 bg-ink-900 text-white hover:bg-ink-800"
          >
            <I.plus size={15} /> Novo Projeto
          </Link>
        }
      >
        <TopbarChrome perfil="auditor" />
      </Topbar>

      <div className="px-10 py-8 grid gap-7" style={{ gridTemplateColumns: "minmax(0,1fr) 340px" }}>
        <div className="flex flex-col gap-7 min-w-0">
          {dashboardQ.isError ? (
            <ErrorAlert
              message={handleApiError(dashboardQ.error)}
              onRetry={() => dashboardQ.refetch()}
            />
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {dashboardQ.isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[104px]" />)
              ) : (
                <>
                  <MetricCard
                    label="Meus clientes"
                    value={String((clientsQ.data ?? []).length)}
                    hint="na carteira do escritório"
                    tone="ink"
                    Ic={I.client}
                  />
                  <MetricCard
                    label="Projetos ativos"
                    value={String(d?.totalCiclosAtivos ?? 0)}
                    hint="em andamento"
                    tone="sky"
                    Ic={I.cycle}
                  />
                  <MetricCard
                    label="Aguardando minha revisão"
                    value={String(d?.filaRevisao ?? 0)}
                    hint="documentos para validar"
                    tone="amber"
                    Ic={I.inbox}
                  />
                  <MetricCard
                    label="Itens em atraso"
                    value={String(d?.itensAtrasados ?? 0)}
                    hint="nos seus projetos"
                    tone="amber"
                    Ic={I.alert}
                  />
                </>
              )}
            </div>
          )}

          {/* fila de revisão */}
          <section>
            <SectionTitle
              hint="Itens enviados pelo cliente — aguardando sua decisão"
              action={
                <Link href="/pbc" className="text-ink-900 text-[12.5px] font-medium hover:underline inline-flex items-center gap-1">
                  Ver na Lista PBC <I.arrowR size={13} />
                </Link>
              }
            >
              Minha fila de revisão
            </SectionTitle>
            <div className="bg-white border border-line rounded-lg overflow-hidden">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[11px] tracking-[0.14em] uppercase text-sub border-b border-line bg-paper/40">
                    <th className="px-5 py-3 font-medium">Cliente</th>
                    <th className="px-5 py-3 font-medium">Item PBC</th>
                    <th className="px-5 py-3 font-medium">Há quanto tempo</th>
                    <th className="px-5 py-3 font-medium text-right pr-6">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((r) => {
                    const urgent = r.arquivo && Date.now() - r.arquivo.dataUpload > 18 * 60 * 60000;
                    return (
                      <tr key={r.id} className="row-hover border-b border-line/70 last:border-0">
                        <td className="px-5 py-3.5 text-text">{r.client}</td>
                        <td className="px-5 py-3.5 text-text font-medium">{r.titulo}</td>
                        <td className="px-5 py-3.5 text-sub">
                          {urgent ? (
                            <span style={{ color: "#E5533C" }}>{relTime(r.arquivo?.dataUpload)}</span>
                          ) : (
                            relTime(r.arquivo?.dataUpload)
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right pr-5">
                          <Link
                            href={`/pbc?cycleId=${r.cycleId}`}
                            className="text-ink-900 text-[12.5px] font-medium hover:underline inline-flex items-center gap-1"
                          >
                            Revisar <I.arrowR size={13} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {!queue.length && (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-sub text-[13px]">
                        Nada na fila — tudo revisado. ✨
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* meus projetos ativos */}
          <section>
            <SectionTitle hint="Seus engajamentos em curso">Meus projetos ativos</SectionTitle>
            {cyclesQ.isLoading ? (
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-[140px]" />
                <Skeleton className="h-[140px]" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {activeCycles.map((c, i) => (
                  <article key={c.id} className="bg-white border border-line rounded-lg p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className="w-9 h-9 rounded-md flex items-center justify-center text-ink-900 font-display text-[15px]"
                        style={{ background: ["#E7EFE4", "#E2ECF6"][i % 2] }}
                      >
                        {clientName(c.auditClientId)[0] ?? "—"}
                      </span>
                      <div>
                        <div className="text-text font-medium text-[14px]">{c.titulo}</div>
                        <div className="text-[12px] text-sub">{clientName(c.auditClientId)}</div>
                      </div>
                      <Badge kind={CYCLE_STATUS_VIEW[c.status]} size="sm" />
                    </div>
                    <Progress value={Math.round(c.progressoPercent ?? 0)} width="100%" />
                    <div className="mt-3 pt-3 border-t border-line/80 flex items-center justify-between">
                      <span className="text-[12px] text-sub">
                        Prazo <span className="text-text tabular-nums">{fmtDate(c.dataFim)}</span>
                      </span>
                      <Link
                        href={`/pbc?cycleId=${c.id}`}
                        className="text-ink-900 text-[12.5px] font-medium hover:underline inline-flex items-center gap-1"
                      >
                        Ver Lista PBC <I.arrowR size={13} />
                      </Link>
                    </div>
                  </article>
                ))}
                {!activeCycles.length && (
                  <div className="col-span-2 bg-white border border-dashed border-line rounded-lg p-10 text-center text-sub text-[13px]">
                    Nenhum projeto ativo. Crie um em “Projetos de Auditoria”.
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* itens críticos */}
        <aside className="min-w-0">
          <div className="sticky top-6">
            <div className="flex items-end justify-between mb-3">
              <div>
                <h2 className="font-display text-[20px] text-text">Itens críticos</h2>
                <div className="text-[12.5px] text-sub mt-0.5">Dos seus projetos</div>
              </div>
              <span className="text-[11px] tracking-[0.14em] uppercase text-rust font-semibold">
                {overdue.length} {overdue.length === 1 ? "item" : "itens"}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {overdue.slice(0, 4).map((c) => (
                <article key={c.id} className="bg-white border border-line rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge kind="atrasado" size="sm" />
                    <span className="text-[11px] text-sub tabular-nums">{dueNote(c.prazo)}</span>
                  </div>
                  <div className="font-medium text-[13.5px] leading-snug text-text">{c.titulo}</div>
                  <div className="text-[12px] text-sub mt-0.5">{c.client}</div>
                  <div className="mt-3 pt-3 border-t border-line/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar name={c.responsavel.nome} size={22} />
                      <span className="text-[12px] text-text">{c.responsavel.nome}</span>
                    </div>
                    <Link
                      href={`/pbc?cycleId=${c.cycleId}`}
                      className="text-ink-900 text-[12px] font-medium hover:underline"
                    >
                      Abrir
                    </Link>
                  </div>
                </article>
              ))}
              {!overdue.length && (
                <div className="bg-white border border-dashed border-line rounded-lg p-6 text-center text-sub text-[12.5px]">
                  Nenhum item em atraso. 👏
                </div>
              )}
            </div>
            {d && (
              <div className="mt-4 p-4 rounded-lg border border-dashed border-line text-[12px] text-sub flex items-start gap-2.5">
                <I.shield size={14} className="text-ink-900 mt-0.5" />
                <div>
                  <span className="text-text font-medium">Taxa de entrega:</span>{" "}
                  {Math.round(d.taxaEntregaGeral * 100)}% dos itens aprovados ·{" "}
                  {d.aprovadosHoje} {d.aprovadosHoje === 1 ? "aprovado" : "aprovados"} hoje.
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
