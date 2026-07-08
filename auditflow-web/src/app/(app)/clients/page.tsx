"use client";

/* Gestão de Clientes — dados reais de GET /api/clients */

import { useMemo, useState } from "react";
import Link from "next/link";
import { I } from "@/components/ui/icons";
import { Badge, SegmentBadge } from "@/components/ui/badge";
import { Btn } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { SelectField } from "@/components/ui/form";
import { Topbar } from "@/components/layout/topbar";
import { CardsSkeleton, ErrorAlert } from "@/components/ui/skeleton";
import { AddClientSlideOver } from "@/components/clients/add-client-slide-over";
import { ReassignModal } from "@/components/clients/reassign-modal";
import { NewCycleSlideOver } from "@/components/cycles/new-cycle-slide-over";
import { usePerfil } from "@/store/perfil-context";
import { useAuditClients } from "@/hooks/use-audit-clients";
import { handleApiError } from "@/lib/error-handler";
import type { AuditClientResponse } from "@/types/api";

const TONES = ["#1A3A4A", "#2C7BE5", "#0A8F6A", "#7E3AF2", "#B47600", "#6B7280"];

function Metric({ v, l, danger }: { v: number; l: string; danger?: boolean }) {
  return (
    <div>
      <div
        className="font-display text-[24px] leading-none tabular-nums"
        style={{ color: danger ? "#E5533C" : "#0D1F2D" }}
      >
        {v}
      </div>
      <div className="text-[10.5px] text-sub mt-1">{l}</div>
    </div>
  );
}

function ClientCard({
  c,
  tone,
  isManager,
  onReassign,
  onNewCycle,
}: {
  c: AuditClientResponse;
  tone: string;
  isManager: boolean;
  onReassign: (c: AuditClientResponse) => void;
  onNewCycle: (c: AuditClientResponse) => void;
}) {
  const auditor = c.auditorResponsavel;
  return (
    <article className="bg-white border border-line rounded-lg p-5 flex flex-col hover:border-ink-800/30 transition-colors">
      <div className="flex items-start gap-3.5">
        <span
          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-display text-[22px] shrink-0"
          style={{ background: tone }}
        >
          {c.nomeEmpresa[0]}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[19px] text-text leading-tight">{c.nomeEmpresa}</h3>
          <div className="text-[12px] text-sub tabular-nums mt-0.5">{c.cnpj}</div>
          {/* slot fixo para o segmento — mantém a altura do header igual com/sem segmento */}
          <div className="mt-2 min-h-[22px]">
            {c.segmento ? <SegmentBadge>{c.segmento}</SegmentBadge> : null}
          </div>
        </div>
        {c.ativo ? (
          <Badge kind="encerrado" size="sm">
            Ativo
          </Badge>
        ) : (
          <Badge size="sm">Inativo</Badge>
        )}
      </div>

      {/* somente manager: auditor responsável */}
      {isManager && (
        <div className="mt-3.5 pt-3.5 border-t border-line">
          {auditor ? (
            <div className="flex items-center gap-2 text-[12.5px]">
              <Avatar name={auditor.nome} size={22} />
              <span className="text-sub">Auditor responsável:</span>
              <span className="text-text font-medium">{auditor.nome}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <Badge size="sm" kind="pendente">
                Sem auditor atribuído
              </Badge>
              <button
                onClick={() => onReassign(c)}
                className="text-[12px] text-ink-900 font-medium hover:underline inline-flex items-center gap-1"
              >
                Atribuir <I.arrowR size={12} />
              </button>
            </div>
          )}
        </div>
      )}

      <div className={`border-t border-line ${isManager ? "mt-3.5 pt-4" : "my-4"}`} />

      <div className="grid grid-cols-2 gap-2 text-center">
        <Metric v={c.totalCiclos ?? 0} l="projetos" />
        <Metric v={c.ciclosAtivos ?? 0} l="ciclos ativos" />
      </div>

      <div className="border-t border-line mt-auto pt-3.5 flex items-center justify-between gap-2">
        <Link
          href={`/clients/${c.id}`}
          className="text-[12.5px] text-ink-900 font-medium hover:underline inline-flex items-center gap-1 shrink-0"
        >
          Ver detalhes <I.arrowR size={13} />
        </Link>
        <div className="flex items-center gap-1.5">
          {isManager && auditor && (
            <Btn kind="ghost" size="sm" onClick={() => onReassign(c)}>
              Reatribuir
            </Btn>
          )}
          <Btn kind="subtle" size="sm" icon={<I.plus />} onClick={() => onNewCycle(c)}>
            Novo Projeto
          </Btn>
        </div>
      </div>
    </article>
  );
}

export default function ClientsPage() {
  const { perfil } = usePerfil();
  const isM = perfil === "manager";
  const [seg, setSeg] = useState("Todos os segmentos");
  const [status, setStatus] = useState("Todos");
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [reassign, setReassign] = useState<AuditClientResponse | null>(null);
  const [newCycleFor, setNewCycleFor] = useState<AuditClientResponse | null>(null);

  const clientsQ = useAuditClients();
  const scope = useMemo(() => clientsQ.data ?? [], [clientsQ.data]);

  const segments = useMemo(() => {
    const s = new Set<string>();
    scope.forEach((c) => c.segmento && s.add(c.segmento));
    return ["Todos os segmentos", ...Array.from(s)];
  }, [scope]);

  const list = scope.filter((c) => {
    if (seg !== "Todos os segmentos" && c.segmento !== seg) return false;
    if (status === "Ativo" && !c.ativo) return false;
    if (status === "Inativo" && c.ativo) return false;
    if (search.trim() && !`${c.nomeEmpresa} ${c.cnpj}`.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div>
      <Topbar
        perfil={perfil}
        title={isM ? "Clientes da Firma" : "Meus Clientes"}
        subtitle={
          <>
            Carteira completa ·{" "}
            <span className="text-text font-medium">
              {scope.length} {scope.length === 1 ? "cliente" : "clientes"}
            </span>
          </>
        }
        action={
          isM ? (
            <Btn kind="primary" icon={<I.plus />} onClick={() => setAddOpen(true)}>
              Adicionar Cliente
            </Btn>
          ) : null
        }
      />

      <div className="px-10 py-6">
        {/* filtros */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 max-w-[340px]">
            <I.search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sub" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou CNPJ…"
              className="w-full h-10 pl-9 pr-3 bg-white border border-line rounded-md text-[13px] placeholder:text-sub outline-none focus:border-mint focus:ring-2 focus:ring-mint/20"
            />
          </div>
          <div className="w-[190px]">
            <SelectField value={seg} onChange={(e) => setSeg(e.target.value)} options={segments} />
          </div>
          <div className="w-[140px]">
            <SelectField
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={["Todos", "Ativo", "Inativo"]}
            />
          </div>
          <div className="ml-auto text-[12.5px] text-sub">
            {list.length} de {scope.length}
          </div>
        </div>

        {clientsQ.isLoading && <CardsSkeleton cards={6} />}
        {clientsQ.isError && (
          <ErrorAlert message={handleApiError(clientsQ.error)} onRetry={() => clientsQ.refetch()} />
        )}

        {clientsQ.isSuccess && (
          <>
            <div className="grid grid-cols-3 gap-4">
              {list.map((c, i) => (
                <ClientCard
                  key={c.id}
                  c={c}
                  tone={TONES[i % TONES.length]}
                  isManager={isM}
                  onReassign={setReassign}
                  onNewCycle={setNewCycleFor}
                />
              ))}
            </div>
            {!list.length && (
              <div className="bg-white border border-dashed border-line rounded-lg p-12 text-center text-sub text-[13px]">
                {scope.length
                  ? "Nenhum cliente corresponde aos filtros."
                  : "Nenhum cliente cadastrado ainda. Adicione o primeiro."}
              </div>
            )}
          </>
        )}
      </div>

      {addOpen && <AddClientSlideOver onClose={() => setAddOpen(false)} />}
      {reassign && <ReassignModal client={reassign} onClose={() => setReassign(null)} />}
      {newCycleFor && (
        <NewCycleSlideOver defaultClientId={newCycleFor.id} onClose={() => setNewCycleFor(null)} />
      )}
    </div>
  );
}
