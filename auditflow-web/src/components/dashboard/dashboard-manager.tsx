"use client";

import { useMemo } from "react";
import Link from "next/link";
import { I } from "@/components/ui/icons";
import { Avatar } from "@/components/ui/avatar";
import { Topbar, TopbarChrome, SectionTitle } from "@/components/layout/topbar";
import { Skeleton, ErrorAlert } from "@/components/ui/skeleton";
import { MetricCard } from "./metric-card";
import { DonutLegend } from "./donut-legend";
import { useDashboardSummary, useAuditorLoad } from "@/hooks/use-dashboard";
import { useAuditClients } from "@/hooks/use-audit-clients";
import { handleApiError } from "@/lib/error-handler";

function todayGreeting(): string {
  const s = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function DashboardManager() {
  const dashboardQ = useDashboardSummary();
  const clientsQ = useAuditClients();
  const loadQ = useAuditorLoad();

  const d = dashboardQ.data;
  const clients = useMemo(() => clientsQ.data ?? [], [clientsQ.data]);
  const load = useMemo(() => loadQ.data ?? [], [loadQ.data]);

  const clientesAtivos = clients.filter((c) => c.ativo).length;
  const auditoresAtivos = load.filter((a) => a.ativo).length;
  const semAuditor = clients.filter((c) => !c.auditorResponsavel).length;

  // Alertas derivados de dados reais
  const alerts = useMemo(() => {
    const list: { tone: string; text: string }[] = [];
    if (semAuditor > 0)
      list.push({
        tone: "#F0A500",
        text: `${semAuditor} cliente(s) sem auditor responsável`,
      });
    if ((d?.itensAtrasados ?? 0) > 0)
      list.push({
        tone: "#E5533C",
        text: `${d!.itensAtrasados} item(ns) em atraso em toda a firma`,
      });
    if ((d?.filaRevisao ?? 0) > 0)
      list.push({
        tone: "#2C7BE5",
        text: `${d!.filaRevisao} item(ns) aguardando revisão da equipe`,
      });
    const overloaded = load.filter((a) => a.pendentesRevisao > 10);
    overloaded.forEach((a) =>
      list.push({ tone: "#E5533C", text: `${a.nome} com ${a.pendentesRevisao} revisões pendentes` })
    );
    return list;
  }, [d, load, semAuditor]);

  const idle = load.find((a) => a.ciclosAtivos === 0 && a.ativo);

  return (
    <div>
      <Topbar
        perfil="manager"
        greeting={todayGreeting()}
        title="Visão Geral da Firma"
        subtitle={
          <>
            <span className="text-text font-medium">{auditoresAtivos} auditores ativos</span> ·{" "}
            {clients.length} clientes na carteira
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
        <TopbarChrome perfil="manager" />
      </Topbar>

      <div className="px-10 py-8 grid gap-7" style={{ gridTemplateColumns: "minmax(0,1fr) 340px" }}>
        <div className="flex flex-col gap-7 min-w-0">
          {dashboardQ.isError ? (
            <ErrorAlert message={handleApiError(dashboardQ.error)} onRetry={() => dashboardQ.refetch()} />
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {dashboardQ.isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[104px]" />)
              ) : (
                <>
                  <MetricCard
                    label="Clientes ativos"
                    value={String(clientesAtivos)}
                    hint="carteira da firma"
                    tone="ink"
                    Ic={I.client}
                  />
                  <MetricCard
                    label="Projetos em andamento"
                    value={String(d?.totalCiclosAtivos ?? 0)}
                    hint="todos os auditores"
                    tone="sky"
                    Ic={I.cycle}
                  />
                  <MetricCard
                    label="Itens em atraso"
                    value={String(d?.itensAtrasados ?? 0)}
                    hint="toda a firma"
                    tone="amber"
                    Ic={I.alert}
                  />
                  <MetricCard
                    label="Taxa de entrega global"
                    value={`${Math.round((d?.taxaEntregaGeral ?? 0) * 100)}%`}
                    hint="itens aprovados/em revisão"
                    tone="mint"
                    Ic={I.trending}
                  />
                </>
              )}
            </div>
          )}

          {/* carga por auditor */}
          <section>
            <SectionTitle hint="Distribuição de trabalho na equipe">Carga por auditor</SectionTitle>
            {loadQ.isError ? (
              <ErrorAlert message={handleApiError(loadQ.error)} onRetry={() => loadQ.refetch()} />
            ) : (
              <div className="bg-white border border-line rounded-lg overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-left text-[11px] tracking-[0.14em] uppercase text-sub border-b border-line bg-paper/40">
                      <th className="px-5 py-3 font-medium">Auditor</th>
                      <th className="px-5 py-3 font-medium text-center">Clientes</th>
                      <th className="px-5 py-3 font-medium text-center">Projetos ativos</th>
                      <th className="px-5 py-3 font-medium text-center">Pend. revisão</th>
                      <th className="px-5 py-3 font-medium text-center">Em atraso</th>
                      <th className="px-5 py-3 font-medium text-right pr-6"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadQ.isLoading && (
                      <tr>
                        <td colSpan={6} className="px-5 py-6">
                          <Skeleton className="h-8" />
                        </td>
                      </tr>
                    )}
                    {loadQ.isSuccess &&
                      load.map((a) => (
                        <tr
                          key={a.auditorId}
                          className="border-b border-line/70 last:border-0"
                          style={!a.ativo ? { opacity: 0.55 } : undefined}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={a.nome} size={28} />
                              <div className="leading-tight">
                                <div className="text-text font-medium">{a.nome}</div>
                                <div className="text-[11px] text-sub">
                                  {a.perfil === "ADMIN" ? "Admin" : "Auditor"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center tabular-nums text-text">{a.clientes}</td>
                          <td className="px-5 py-4 text-center tabular-nums text-text">{a.ciclosAtivos}</td>
                          <td className="px-5 py-4 text-center">
                            <span
                              className="tabular-nums font-medium"
                              style={{ color: a.pendentesRevisao > 10 ? "#E5533C" : "#1C1C1E" }}
                            >
                              {a.pendentesRevisao}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span
                              className="tabular-nums font-medium"
                              style={{ color: a.atrasados >= 4 ? "#E5533C" : "#1C1C1E" }}
                            >
                              {a.atrasados}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right pr-5">
                            <Link
                              href="/assignments"
                              className="text-ink-900 text-[12.5px] font-medium hover:underline"
                            >
                              Ver detalhe
                            </Link>
                          </td>
                        </tr>
                      ))}
                    {loadQ.isSuccess && !load.length && (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-sub text-[13px]">
                          Nenhum auditor cadastrado. Convide sua equipe em Configurações.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="bg-white border border-line rounded-lg p-5">
            <SectionTitle hint="Status agregado de todos os projetos da firma">Distribuição de status</SectionTitle>
            <DonutLegend firm />
          </section>
        </div>

        {/* alertas */}
        <aside className="min-w-0">
          <div className="sticky top-6">
            <div className="flex items-end justify-between mb-3">
              <div>
                <h2 className="font-display text-[20px] text-text">Alertas da firma</h2>
                <div className="text-[12.5px] text-sub mt-0.5">Situações que pedem atenção</div>
              </div>
              {alerts.length > 0 && (
                <span className="text-[11px] tracking-[0.14em] uppercase text-rust font-semibold">
                  {alerts.length}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2.5">
              {alerts.map((a, i) => (
                <article key={i} className="bg-white border border-line rounded-lg p-4 flex items-start gap-3">
                  <span className="mt-1 w-2 h-2 rounded-full shrink-0" style={{ background: a.tone }} />
                  <div className="text-[13px] text-text leading-snug flex-1">{a.text}</div>
                </article>
              ))}
              {!alerts.length && !dashboardQ.isLoading && (
                <div className="bg-white border border-dashed border-line rounded-lg p-6 text-center text-sub text-[12.5px]">
                  Nenhum alerta no momento. 👏
                </div>
              )}
            </div>
            {idle && (
              <div className="mt-4 p-4 rounded-lg border border-dashed border-line text-[12px] text-sub flex items-start gap-2.5">
                <I.users size={14} className="text-ink-900 mt-0.5" />
                <div>
                  <span className="text-text font-medium">{idle.nome}</span> está sem projetos ativos.
                  Considere reatribuir um cliente em{" "}
                  <Link href="/assignments" className="text-ink-900 underline">
                    Atribuições
                  </Link>
                  .
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
