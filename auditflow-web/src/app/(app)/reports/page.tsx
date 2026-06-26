"use client";

/* Relatórios e Analytics — dados reais de GET /api/reports (escopo por perfil)
   + GET /api/dashboard/auditor-load (somente manager). */

import { useMemo } from "react";
import { I } from "@/components/ui/icons";
import { Btn } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Topbar } from "@/components/layout/topbar";
import { ChartCard } from "@/components/reports/charts";
import { DonutLegend } from "@/components/dashboard/donut-legend";
import { Skeleton, ErrorAlert } from "@/components/ui/skeleton";
import { usePerfil } from "@/store/perfil-context";
import { useReports } from "@/hooks/use-reports";
import { useAuditorLoad } from "@/hooks/use-dashboard";
import { handleApiError } from "@/lib/error-handler";
import { pushToast } from "@/store/toast-store";
import type { ReportResponse } from "@/types/api";

function Kpi({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="bg-white border border-line rounded-lg p-5">
      <div className="text-[11.5px] tracking-[0.16em] uppercase text-sub">{label}</div>
      <div className="flex items-end gap-2 mt-3">
        <span className="font-display text-[40px] leading-[0.95] tabular-nums text-ink-900">{value}</span>
        {unit && <span className="text-[14px] text-sub mb-1.5">{unit}</span>}
      </div>
    </div>
  );
}

function toCsv(report: ReportResponse): string {
  const head = ["Cliente", "Total", "Pendentes", "Em Revisão", "Aprovados", "Rejeitados", "Atrasados"];
  const rows = report.desempenhoPorCliente.map((c) =>
    [c.cliente, c.total, c.pendentes, c.emRevisao, c.aprovados, c.rejeitados, c.atrasados].join(";")
  );
  return [head.join(";"), ...rows].join("\n");
}

export default function ReportsPage() {
  const { perfil } = usePerfil();
  const isM = perfil === "manager";
  const reportQ = useReports();
  const loadQ = useAuditorLoad(isM);
  const r = reportQ.data;

  const maxCarteira = useMemo(
    () => Math.max(1, ...(loadQ.data ?? []).map((a) => a.ciclosAtivos)),
    [loadQ.data]
  );

  const exportCsv = () => {
    if (!r) return;
    const blob = new Blob([toCsv(r)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "auditflow-relatorio.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    pushToast("success", "CSV exportado");
  };

  return (
    <div>
      <Topbar
        perfil={perfil}
        title={isM ? "Relatórios da Firma" : "Meus Relatórios"}
        subtitle={isM ? "Performance geral da firma" : "Seus projetos e clientes"}
        action={
          <Btn kind="ghost" icon={<I.file />} onClick={exportCsv} disabled={!r}>
            Exportar CSV
          </Btn>
        }
      />

      <div className="px-10 py-8 flex flex-col gap-7">
        {reportQ.isError && (
          <ErrorAlert message={handleApiError(reportQ.error)} onRetry={() => reportQ.refetch()} />
        )}

        {reportQ.isLoading && (
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[120px]" />
            ))}
          </div>
        )}

        {reportQ.isSuccess && r && (
          <>
            {/* KPIs reais */}
            <div className="grid grid-cols-4 gap-4">
              <Kpi label="Projetos" value={String(r.projetosTotal)} />
              <Kpi label="Projetos ativos" value={String(r.projetosAtivos)} />
              <Kpi label="Itens em atraso" value={String(r.itensAtrasados)} />
              <Kpi label="Taxa de entrega" value={`${Math.round(r.taxaEntrega * 100)}`} unit="%" />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <ChartCard title="Entregas por status" hint="Distribuição real dos itens PBC">
                <DonutLegend firm={isM} />
              </ChartCard>

              <ChartCard title="Desempenho por cliente" hint="Itens aprovados sobre o total">
                {r.desempenhoPorCliente.length ? (
                  <ul className="flex flex-col gap-3.5">
                    {r.desempenhoPorCliente.map((c) => {
                      const pct = c.total ? Math.round((c.aprovados / c.total) * 100) : 0;
                      return (
                        <li key={c.clienteId}>
                          <div className="flex items-center justify-between text-[12.5px] mb-1">
                            <span className="text-text font-medium">{c.cliente}</span>
                            <span className="text-sub tabular-nums">
                              {c.aprovados}/{c.total} · {pct}%
                            </span>
                          </div>
                          <Progress value={pct} width="100%" color="#00C896" />
                          {c.atrasados > 0 && (
                            <div className="text-[11px] mt-1" style={{ color: "#E5533C" }}>
                              {c.atrasados} em atraso
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="text-[13px] text-sub py-6 text-center">Sem dados de clientes ainda.</div>
                )}
              </ChartCard>
            </div>

            {/* Mais rejeitados — real */}
            <ChartCard title="Mais rejeitados" hint="Motivos de rejeição mais frequentes">
              {r.maisRejeitados.length ? (
                <div className="grid grid-cols-5 gap-4">
                  {r.maisRejeitados.map((m, i) => (
                    <div key={i} className="text-center">
                      <div className="font-display text-[28px] text-ink-900 tabular-nums">{m.total}</div>
                      <span
                        className="inline-flex mt-1.5 px-2 py-0.5 rounded text-[10.5px]"
                        style={{ color: "#E5533C", background: "rgba(229,83,60,0.1)" }}
                      >
                        {m.motivo}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[13px] text-sub py-4 text-center">Nenhum item rejeitado no período. 👏</div>
              )}
            </ChartCard>

            {/* MANAGER: carga por auditor (real) */}
            {isM && (
              <div className="grid gap-5" style={{ gridTemplateColumns: "1.55fr 1fr" }}>
                <ChartCard title="Desempenho por auditor" hint="Equipe interna">
                  {loadQ.isError ? (
                    <ErrorAlert message={handleApiError(loadQ.error)} onRetry={() => loadQ.refetch()} />
                  ) : loadQ.isLoading ? (
                    <Skeleton className="h-[160px]" />
                  ) : (
                    <table className="w-full text-[13px] -mt-1">
                      <thead>
                        <tr className="text-left text-[10.5px] tracking-[0.12em] uppercase text-sub border-b border-line">
                          <th className="py-2.5 font-medium">Auditor</th>
                          <th className="py-2.5 font-medium text-center">Clientes</th>
                          <th className="py-2.5 font-medium text-center">Projetos ativos</th>
                          <th className="py-2.5 font-medium text-center">Pend.</th>
                          <th className="py-2.5 font-medium text-center">Atraso</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(loadQ.data ?? []).map((a) => (
                          <tr key={a.auditorId} className="border-b border-line/70 last:border-0">
                            <td className="py-3">
                              <div className="flex items-center gap-2.5">
                                <Avatar name={a.nome} size={26} />
                                <span className="text-text">{a.nome}</span>
                              </div>
                            </td>
                            <td className="py-3 text-center tabular-nums text-text">{a.clientes}</td>
                            <td className="py-3 text-center tabular-nums text-text">{a.ciclosAtivos}</td>
                            <td className="py-3 text-center tabular-nums text-text">{a.pendentesRevisao}</td>
                            <td className="py-3 text-center">
                              <span
                                className="tabular-nums font-medium"
                                style={{ color: a.atrasados >= 4 ? "#E5533C" : "#1C1C1E" }}
                              >
                                {a.atrasados}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </ChartCard>

                <ChartCard title="Distribuição da carteira" hint="Projetos ativos por auditor">
                  {loadQ.isSuccess && (
                    <ul className="flex flex-col gap-3">
                      {(loadQ.data ?? []).map((a) => (
                        <li key={a.auditorId}>
                          <div className="flex items-center justify-between text-[12.5px] mb-1">
                            <span className="text-text">{a.nome}</span>
                            <span className="text-sub tabular-nums">{a.ciclosAtivos}</span>
                          </div>
                          <Progress
                            value={Math.round((a.ciclosAtivos / maxCarteira) * 100)}
                            width="100%"
                            color="#2C7BE5"
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </ChartCard>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
