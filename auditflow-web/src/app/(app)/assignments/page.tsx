"use client";

/* Atribuições de Clientes (somente Manager) — dados reais:
   auditores de GET /api/dashboard/auditor-load, clientes de GET /api/clients,
   atribuição via POST /api/clients/{id}/assign. */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { I } from "@/components/ui/icons";
import { Btn } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { SelectField } from "@/components/ui/form";
import { Topbar } from "@/components/layout/topbar";
import { CardsSkeleton, ErrorAlert } from "@/components/ui/skeleton";
import { ReassignModal } from "@/components/clients/reassign-modal";
import { usePerfil } from "@/store/perfil-context";
import { useAuditClients, useAssignAuditor } from "@/hooks/use-audit-clients";
import { useAuditorLoad } from "@/hooks/use-dashboard";
import { handleApiError } from "@/lib/error-handler";
import { pushToast } from "@/store/toast-store";
import type { AuditClientResponse, AuditorLoadResponse } from "@/types/api";

const TONES = ["#1A3A4A", "#2C7BE5", "#0A8F6A", "#7E3AF2", "#B47600", "#6B7280"];

function AssignUnassigned({
  client,
  auditors,
}: {
  client: AuditClientResponse;
  auditors: AuditorLoadResponse[];
}) {
  const [auditorId, setAuditorId] = useState("");
  const assign = useAssignAuditor();

  const confirm = () => {
    if (!auditorId) return;
    assign.mutate(
      { id: client.id, auditorId },
      {
        onSuccess: (res) =>
          pushToast("success", `${res.nomeEmpresa} atribuído a ${res.auditorResponsavel?.nome ?? "auditor"}`),
        onError: (err) => pushToast("error", handleApiError(err)),
      }
    );
  };

  return (
    <div className="mt-4 flex items-center gap-2">
      <div className="flex-1">
        <SelectField value={auditorId} onChange={(e) => setAuditorId(e.target.value)}>
          <option value="">Selecionar auditor…</option>
          {auditors
            .filter((a) => a.ativo)
            .map((a) => (
              <option key={a.auditorId} value={a.auditorId}>
                {a.nome}
              </option>
            ))}
        </SelectField>
      </div>
      <Btn
        kind="primary"
        size="sm"
        icon={<I.arrowR />}
        onClick={confirm}
        disabled={!auditorId || assign.isPending}
      >
        {assign.isPending ? "…" : "Atribuir"}
      </Btn>
    </div>
  );
}

export default function AssignmentsPage() {
  const { perfil, ready } = usePerfil();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [reassign, setReassign] = useState<AuditClientResponse | null>(null);

  const clientsQ = useAuditClients();
  const loadQ = useAuditorLoad();

  // rota exclusiva do manager
  useEffect(() => {
    if (ready && perfil === "auditor") router.replace("/dashboard");
  }, [ready, perfil, router]);

  const auditors = useMemo(() => loadQ.data ?? [], [loadQ.data]);
  const clients = useMemo(() => clientsQ.data ?? [], [clientsQ.data]);

  // seleciona o primeiro auditor por padrão
  useEffect(() => {
    if (!selected && auditors.length) setSelected(auditors[0].auditorId);
  }, [selected, auditors]);

  const clientsOf = (auditorId: string) =>
    clients.filter((c) => c.auditorResponsavel?.id === auditorId);
  const unassigned = clients.filter((c) => !c.auditorResponsavel);
  const selectedAuditor = auditors.find((a) => a.auditorId === selected);

  if (!ready || perfil === "auditor") return null;

  return (
    <div>
      <Topbar
        perfil="manager"
        title="Atribuições de Clientes"
        subtitle="Gerencie quem cuida de cada cliente"
        action={
          <Btn
            kind="ghost"
            icon={<I.refresh />}
            onClick={() => {
              clientsQ.refetch();
              loadQ.refetch();
            }}
          >
            Atualizar
          </Btn>
        }
      />

      <div className="px-10 py-8">
        {(clientsQ.isError || loadQ.isError) && (
          <ErrorAlert
            message={handleApiError(clientsQ.error ?? loadQ.error)}
            onRetry={() => {
              clientsQ.refetch();
              loadQ.refetch();
            }}
          />
        )}

        {(clientsQ.isLoading || loadQ.isLoading) && <CardsSkeleton cards={3} />}

        {clientsQ.isSuccess && loadQ.isSuccess && (
          <div className="grid gap-7" style={{ gridTemplateColumns: "340px minmax(0,1fr)" }}>
            {/* ESQUERDA: auditores */}
            <aside>
              <div className="text-[11px] tracking-[0.16em] uppercase text-sub mb-3">Auditores</div>
              <div className="flex flex-col gap-2.5">
                {auditors.map((a) => {
                  const is = selected === a.auditorId;
                  const over = a.pendentesRevisao > 10;
                  return (
                    <button
                      key={a.auditorId}
                      onClick={() => setSelected(a.auditorId)}
                      className={`text-left bg-white border rounded-lg p-4 transition-all ${
                        is
                          ? "border-ink-900 shadow-[0_0_0_3px_rgba(13,31,45,0.05)]"
                          : "border-line hover:border-ink-800/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={a.nome} size={38} />
                        <div className="min-w-0 flex-1">
                          <div className="text-[14px] text-text font-medium">{a.nome}</div>
                          <span
                            className="inline-flex items-center gap-1.5 text-[11px] font-medium mt-0.5"
                            style={{ color: over ? "#B47600" : "#0A8F6A" }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: over ? "#F0A500" : "#00C896" }}
                            />
                            {over ? "Sobrecarregado" : "Disponível"}
                          </span>
                        </div>
                        {is && <I.chev size={16} className="text-ink-900" />}
                      </div>
                      <div className="mt-3 pt-3 border-t border-line/70 text-[11.5px] text-sub flex items-center gap-3">
                        <span>
                          <span className="text-text font-medium tabular-nums">{a.clientes}</span> clientes
                        </span>
                        <span className="w-1 h-1 rounded-full bg-line" />
                        <span>
                          <span className="text-text font-medium tabular-nums">{a.ciclosAtivos}</span> projetos
                        </span>
                        <span className="w-1 h-1 rounded-full bg-line" />
                        <span>
                          <span className="text-text font-medium tabular-nums">{a.pendentesRevisao}</span> revisões
                        </span>
                      </div>
                    </button>
                  );
                })}
                {!auditors.length && (
                  <div className="bg-white border border-dashed border-line rounded-lg p-6 text-center text-[12.5px] text-sub">
                    Nenhum auditor. Convide sua equipe em Configurações.
                  </div>
                )}
              </div>
            </aside>

            {/* DIREITA: clientes do auditor selecionado */}
            <section className="min-w-0">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-display text-[20px] text-text">
                    Clientes de {selectedAuditor?.nome ?? "—"}
                  </h2>
                  <div className="text-[12.5px] text-sub mt-0.5">
                    {selected ? clientsOf(selected).length : 0} cliente(s) atribuído(s)
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                {selected &&
                  clientsOf(selected).map((c, i) => (
                    <div key={c.id} className="bg-white border border-line rounded-lg p-4 flex items-center gap-3.5">
                      <span
                        className="w-10 h-10 rounded-md flex items-center justify-center text-white font-display text-[18px]"
                        style={{ background: TONES[i % TONES.length] }}
                      >
                        {c.nomeEmpresa[0]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] text-text font-medium">{c.nomeEmpresa}</div>
                        <div className="text-[12px] text-sub">
                          {c.ciclosAtivos ?? 0} projeto(s) ativo(s){c.segmento ? ` · ${c.segmento}` : ""}
                        </div>
                      </div>
                      <Btn kind="subtle" size="sm" onClick={() => setReassign(c)}>
                        Reatribuir
                      </Btn>
                    </div>
                  ))}
                {selected && !clientsOf(selected).length && (
                  <div className="bg-white border border-dashed border-line rounded-lg p-8 text-center text-[13px] text-sub">
                    {selectedAuditor?.nome} ainda não tem clientes atribuídos. Use a seção “Clientes sem
                    auditor” abaixo.
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* sem auditor */}
        {clientsQ.isSuccess && loadQ.isSuccess && (
          <div className="mt-9">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-display text-[20px] text-text">Clientes sem auditor</h2>
              {unassigned.length > 0 && (
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ color: "#B47600", background: "rgba(240,165,0,0.18)" }}
                >
                  {unassigned.length}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {unassigned.map((c, i) => (
                <div
                  key={c.id}
                  className="rounded-lg p-5 border"
                  style={{ background: "rgba(240,165,0,0.06)", borderColor: "rgba(240,165,0,0.4)" }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-11 h-11 rounded-lg flex items-center justify-center text-white font-display text-[20px]"
                      style={{ background: TONES[i % TONES.length] }}
                    >
                      {c.nomeEmpresa[0]}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[15px] text-text font-medium truncate">{c.nomeEmpresa}</div>
                      <div className="text-[12px] text-sub tabular-nums">
                        {c.segmento ? `${c.segmento} · ` : ""}
                        {c.cnpj}
                      </div>
                    </div>
                  </div>
                  <AssignUnassigned client={c} auditors={auditors} />
                </div>
              ))}
              {!unassigned.length && (
                <div className="col-span-3 text-[13px] text-sub">
                  Todos os clientes têm auditor responsável. 🎉
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {reassign && <ReassignModal client={reassign} onClose={() => setReassign(null)} />}
    </div>
  );
}
