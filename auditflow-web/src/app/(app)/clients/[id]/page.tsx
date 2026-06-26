"use client";

/* Perfil do Cliente (detalhe) — GET /api/clients/{id} + ciclos do cliente.
   TODO: endpoint não disponível — abas "Usuários do Cliente" e "Documentos"
   seguem com dados de demonstração (não há API para listar usuários/documentos
   por cliente). */

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { I } from "@/components/ui/icons";
import { Badge, SegmentBadge } from "@/components/ui/badge";
import { Btn } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { SegTabs } from "@/components/ui/form";
import { Topbar } from "@/components/layout/topbar";
import { Skeleton, ErrorAlert } from "@/components/ui/skeleton";
import { InviteUserModal } from "@/components/clients/invite-user-modal";
import { NewCycleSlideOver } from "@/components/cycles/new-cycle-slide-over";
import { useAuditClient, useClientUsers, useClientDocuments } from "@/hooks/use-audit-clients";
import { useAuditCycles } from "@/hooks/use-audit-cycles";
import { useDeactivateUser } from "@/hooks/use-users";
import { useDownloadDocument } from "@/hooks/use-documents";
import { CYCLE_STATUS_VIEW, cyclePeriod } from "@/lib/adapters";
import { handleApiError } from "@/lib/error-handler";
import { pushToast } from "@/store/toast-store";
import { fmtDate } from "@/lib/format";
import type { BadgeKind } from "@/types";
import type { PbcItemStatusApi } from "@/types/api";

const DOC_STATUS: Record<PbcItemStatusApi, { kind: BadgeKind; label: string }> = {
  PENDENTE: { kind: "pendente", label: "Pendente" },
  EM_REVISAO: { kind: "revisao", label: "Em Revisão" },
  APROVADO: { kind: "aprovado", label: "Aprovado" },
  REJEITADO: { kind: "rejeitado", label: "Rejeitado" },
};

const TABS = ["Projetos de Auditoria", "Usuários do Cliente", "Documentos"];

function Stat({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sub">{l}</span>
      <span className="text-text tabular-nums font-medium">{v}</span>
    </div>
  );
}

export default function ClientProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState(TABS[0]);
  const [docFilter, setDocFilter] = useState("Todos");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [newCycleOpen, setNewCycleOpen] = useState(false);

  const clientQ = useAuditClient(params.id);
  const cyclesQ = useAuditCycles({ auditClientId: params.id });
  const clientUsersQ = useClientUsers(params.id);
  const clientDocsQ = useClientDocuments(params.id);
  const deactivate = useDeactivateUser();
  const downloadDoc = useDownloadDocument();
  const c = clientQ.data;

  const revoke = (id: string, nome: string) => {
    if (typeof window !== "undefined" && !window.confirm(`Revogar o acesso de ${nome}?`)) return;
    deactivate.mutate(id, {
      onSuccess: () => pushToast("success", `Acesso de ${nome} revogado`),
      onError: (err) => pushToast("error", handleApiError(err)),
    });
  };

  if (clientQ.isLoading) {
    return (
      <div className="px-10 py-10 flex flex-col gap-5">
        <Skeleton className="h-20 w-1/2" />
        <Skeleton className="h-[360px]" />
      </div>
    );
  }

  if (clientQ.isError || !c) {
    return (
      <div className="px-10 py-10">
        <ErrorAlert
          message={handleApiError(clientQ.error, "Cliente não encontrado.")}
          onRetry={() => clientQ.refetch()}
        />
        <button onClick={() => router.push("/clients")} className="mt-4 text-[13px] text-ink-900 underline">
          Voltar para Clientes
        </button>
      </div>
    );
  }

  const cycles = cyclesQ.data ?? [];

  return (
    <div>
      <Topbar
        breadcrumb={["Clientes", c.nomeEmpresa]}
        title={c.nomeEmpresa}
        subtitle={
          <>
            {c.segmento && <SegmentBadge>{c.segmento}</SegmentBadge>}{" "}
            <span className="ml-2 tabular-nums">{c.cnpj}</span>
          </>
        }
        action={
          <Btn kind="primary" icon={<I.users />} onClick={() => setInviteOpen(true)}>
            Convidar Usuário
          </Btn>
        }
      >
        <button
          onClick={() => router.push("/clients")}
          className="h-10 px-3 rounded-md border border-line bg-white text-sub hover:text-text inline-flex items-center gap-1.5 text-[12.5px]"
        >
          <I.arrowL size={14} />
          Voltar
        </button>
      </Topbar>

      <div className="px-10 py-8 grid gap-7" style={{ gridTemplateColumns: "320px minmax(0,1fr)" }}>
        {/* ESQUERDA — perfil */}
        <aside className="min-w-0">
          <div className="bg-white border border-line rounded-lg p-6">
            <div className="flex flex-col items-center text-center pb-5 border-b border-line">
              <span
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-display text-[36px]"
                style={{ background: "#1A3A4A" }}
              >
                {c.nomeEmpresa[0]}
              </span>
              <h2 className="font-display text-[24px] text-text mt-3 leading-tight">{c.nomeEmpresa}</h2>
              <div className="mt-2 flex items-center gap-2">
                {c.segmento && <SegmentBadge>{c.segmento}</SegmentBadge>}
                {c.ativo ? (
                  <Badge kind="encerrado" size="sm">
                    Ativo
                  </Badge>
                ) : (
                  <Badge size="sm">Inativo</Badge>
                )}
              </div>
              <div className="text-[12px] text-sub tabular-nums mt-2">{c.cnpj}</div>
            </div>

            <div className="py-5 border-b border-line">
              <div className="text-[11px] tracking-[0.16em] uppercase text-sub mb-3">Contato principal</div>
              <ul className="flex flex-col gap-2 text-[12.5px]">
                {c.emailContato && (
                  <li className="flex items-center gap-2.5 text-text">
                    <I.mail size={13} className="text-sub" />
                    <a className="hover:underline">{c.emailContato}</a>
                  </li>
                )}
                {c.site && (
                  <li className="flex items-center gap-2.5 text-text">
                    <I.globe size={13} className="text-sub" />
                    <span className="truncate">{c.site}</span>
                  </li>
                )}
                {c.endereco && (
                  <li className="flex items-center gap-2.5 text-text">
                    <I.pin size={13} className="text-sub" />
                    <span className="truncate">{c.endereco}</span>
                  </li>
                )}
                {!c.emailContato && !c.site && !c.endereco && (
                  <li className="text-sub">Sem dados de contato.</li>
                )}
              </ul>
            </div>

            <div className="py-5 border-b border-line">
              <div className="text-[11px] tracking-[0.16em] uppercase text-sub mb-3">
                Auditor responsável
              </div>
              {c.auditorResponsavel ? (
                <div className="flex items-center gap-3">
                  <Avatar name={c.auditorResponsavel.nome} size={36} />
                  <div className="leading-tight">
                    <div className="text-[13.5px] text-text font-medium">{c.auditorResponsavel.nome}</div>
                    <div className="text-[11.5px] text-sub">{c.auditorResponsavel.email}</div>
                  </div>
                </div>
              ) : (
                <Badge size="sm" kind="pendente">
                  Sem auditor atribuído
                </Badge>
              )}
            </div>

            <div className="py-5">
              <div className="text-[11px] tracking-[0.16em] uppercase text-sub mb-3">Resumo de atividade</div>
              <div className="flex flex-col gap-2.5 text-[13px]">
                <Stat l="Total de projetos" v={String(c.totalCiclos ?? 0)} />
                <Stat l="Projetos ativos" v={String(c.ciclosAtivos ?? 0)} />
              </div>
            </div>
          </div>
        </aside>

        {/* DIREITA — abas */}
        <section className="min-w-0">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-1 border-b border-line">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`relative h-10 px-4 text-[13px] transition-colors ${
                    tab === t ? "text-text" : "text-sub hover:text-text"
                  }`}
                >
                  {t}
                  {tab === t && <span className="absolute left-3 right-3 -bottom-px h-0.5 bg-ink-900" />}
                </button>
              ))}
            </div>
            {tab === "Projetos de Auditoria" && (
              <Btn kind="primary" size="sm" icon={<I.plus />} onClick={() => setNewCycleOpen(true)}>
                Novo Projeto
              </Btn>
            )}
            {tab === "Usuários do Cliente" && (
              <Btn kind="primary" size="sm" icon={<I.users />} onClick={() => setInviteOpen(true)}>
                Convidar Novo Usuário
              </Btn>
            )}
          </div>

          {tab === "Projetos de Auditoria" && (
            <>
              {cyclesQ.isError && (
                <ErrorAlert message={handleApiError(cyclesQ.error)} onRetry={() => cyclesQ.refetch()} />
              )}
              <div className="bg-white border border-line rounded-lg overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-left text-[11px] tracking-[0.14em] uppercase text-sub border-b border-line bg-paper/40">
                      <th className="px-5 py-3 font-medium">Nome do projeto</th>
                      <th className="px-5 py-3 font-medium">Tipo</th>
                      <th className="px-5 py-3 font-medium">Período</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Progresso</th>
                      <th className="px-5 py-3 font-medium text-right pr-6">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cycles.map((r) => {
                      const view = CYCLE_STATUS_VIEW[r.status];
                      return (
                        <tr key={r.id} className="row-hover border-b border-line/70 last:border-0">
                          <td className="px-5 py-4 text-text font-medium">{r.titulo}</td>
                          <td className="px-5 py-4 text-sub">{r.tipo ?? "—"}</td>
                          <td className="px-5 py-4 text-sub tabular-nums">
                            {cyclePeriod(r.dataInicio, r.dataFim)}
                          </td>
                          <td className="px-5 py-4">
                            <Badge kind={view} />
                          </td>
                          <td className="px-5 py-4">
                            <Progress
                              value={Math.round(r.progressoPercent ?? 0)}
                              color={view === "encerrado" ? "#0A8F6A" : "#0D1F2D"}
                              width={90}
                            />
                          </td>
                          <td className="px-5 py-4 text-right pr-5">
                            <Link
                              href={`/pbc?cycleId=${r.id}`}
                              className="h-8 px-3 rounded-md border border-line bg-paper text-text text-[12px] inline-flex items-center hover:bg-white"
                            >
                              Abrir
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                    {cyclesQ.isSuccess && !cycles.length && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-sub text-[13px]">
                          Nenhum projeto para este cliente ainda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === "Usuários do Cliente" && (
            <div className="flex flex-col gap-4">
              {clientUsersQ.isError && (
                <ErrorAlert message={handleApiError(clientUsersQ.error)} onRetry={() => clientUsersQ.refetch()} />
              )}
              {clientUsersQ.isLoading && <Skeleton className="h-[180px]" />}
              {clientUsersQ.isSuccess && (
                <div className="bg-white border border-line rounded-lg overflow-hidden">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="text-left text-[11px] tracking-[0.14em] uppercase text-sub border-b border-line bg-paper/40">
                        <th className="px-5 py-3 font-medium">Usuário</th>
                        <th className="px-5 py-3 font-medium">E-mail</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium">Desde</th>
                        <th className="px-5 py-3 font-medium text-right pr-6">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientUsersQ.data.map((u) => (
                        <tr key={u.id} className="row-hover border-b border-line/70 last:border-0">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={u.nome} size={28} />
                              <span className="text-text">{u.nome}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sub">{u.email}</td>
                          <td className="px-5 py-4">
                            {u.ativo ? (
                              <Badge kind="encerrado" size="sm">
                                Ativo
                              </Badge>
                            ) : (
                              <Badge size="sm">Inativo</Badge>
                            )}
                          </td>
                          <td className="px-5 py-4 text-sub tabular-nums">{fmtDate(u.criadoEm)}</td>
                          <td className="px-5 py-4 text-right pr-5">
                            {u.ativo ? (
                              <button
                                onClick={() => revoke(u.id, u.nome)}
                                disabled={deactivate.isPending}
                                className="text-[12px] text-rust hover:underline disabled:opacity-40"
                              >
                                Revogar acesso
                              </button>
                            ) : (
                              <span className="text-[12px] text-sub">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {!clientUsersQ.data.length && (
                        <tr>
                          <td colSpan={5} className="px-5 py-10 text-center text-sub text-[13px]">
                            Nenhum usuário do cliente. Use “Convidar Usuário”.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === "Documentos" && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <SegTabs
                  tabs={["Todos", "Aprovado", "Em Revisão", "Rejeitado", "Pendente"]}
                  active={docFilter}
                  onChange={setDocFilter}
                />
              </div>
              {clientDocsQ.isError && (
                <ErrorAlert message={handleApiError(clientDocsQ.error)} onRetry={() => clientDocsQ.refetch()} />
              )}
              {clientDocsQ.isLoading && <Skeleton className="h-[180px]" />}
              {clientDocsQ.isSuccess && (
                <div className="bg-white border border-line rounded-lg overflow-hidden">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="text-left text-[11px] tracking-[0.14em] uppercase text-sub border-b border-line bg-paper/40">
                        <th className="px-5 py-3 font-medium">Arquivo</th>
                        <th className="px-5 py-3 font-medium">Projeto</th>
                        <th className="px-5 py-3 font-medium">Item PBC</th>
                        <th className="px-5 py-3 font-medium">Data</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium text-right pr-6"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientDocsQ.data
                        .filter((d) => docFilter === "Todos" || DOC_STATUS[d.itemStatus].label === docFilter)
                        .map((d) => (
                          <tr key={d.id} className="row-hover border-b border-line/70 last:border-0">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded flex items-center justify-center bg-paper text-ink-900">
                                  <I.file size={14} />
                                </span>
                                <span className="text-text font-medium">{d.nomeArquivo}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sub">{d.cicloTitulo}</td>
                            <td className="px-5 py-4 text-sub">{d.itemTitulo}</td>
                            <td className="px-5 py-4 text-sub tabular-nums">{fmtDate(d.enviadoEm)}</td>
                            <td className="px-5 py-4">
                              <Badge kind={DOC_STATUS[d.itemStatus].kind} />
                            </td>
                            <td className="px-5 py-4 text-right pr-5">
                              <button
                                onClick={() => downloadDoc.mutate({ id: d.id, fileName: d.nomeArquivo })}
                                disabled={downloadDoc.isPending}
                                className="w-8 h-8 rounded-md border border-line bg-white text-sub hover:text-text inline-flex items-center justify-center disabled:opacity-40"
                              >
                                <I.download size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      {!clientDocsQ.data.length && (
                        <tr>
                          <td colSpan={6} className="px-5 py-10 text-center text-sub text-[13px]">
                            Nenhum documento enviado por este cliente ainda.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {inviteOpen && <InviteUserModal clientId={c.id} clientName={c.nomeEmpresa} onClose={() => setInviteOpen(false)} />}
      {newCycleOpen && <NewCycleSlideOver defaultClientId={c.id} onClose={() => setNewCycleOpen(false)} />}
    </div>
  );
}
