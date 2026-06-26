/* ============================================================
   Adapters: DTOs da API → modelos de visualização usados pelos
   componentes (mantém Badge/PbcDetailModal/TaskRow etc. intactos).
   ============================================================ */

import type { CycleStatus, PbcItem, TimelineEntry, TimelineTone } from "@/types";
import type {
  CycleStatusApi,
  PbcItemResponse,
  TimelineEventResponse,
} from "@/types/api";
import { tsFromIso } from "./format";

/* status do ciclo no backend → badge de exibição */
export const CYCLE_STATUS_VIEW: Record<CycleStatusApi, CycleStatus> = {
  ABERTO: "planejamento",
  EM_ANDAMENTO: "andamento",
  ENCERRADO: "encerrado",
};

export const CYCLE_STATUS_LABEL: Record<CycleStatusApi, string> = {
  ABERTO: "Aberto",
  EM_ANDAMENTO: "Em Andamento",
  ENCERRADO: "Encerrado",
};

function timelineTone(e: TimelineEventResponse): TimelineTone {
  const text = `${e.acao} ${e.descricao ?? ""}`.toLowerCase();
  if (text.includes("rejei")) return "rejected";
  if (text.includes("aprov")) return "approved";
  return "neutral";
}

export function toViewTimeline(events: TimelineEventResponse[] | undefined): TimelineEntry[] {
  return (events ?? []).map((e) => ({
    ts: tsFromIso(e.timestamp),
    ator: e.atorNome,
    acao: e.descricao ? `${e.acao} — ${e.descricao}` : e.acao,
    tone: timelineTone(e),
  }));
}

export interface PbcViewOptions {
  /** posição na lista (gera o nº exibido) */
  index?: number;
  clientName?: string;
  responsavelNome?: string;
  responsavelEmail?: string;
}

export function toViewPbcItem(r: PbcItemResponse, opts: PbcViewOptions = {}): PbcItem {
  return {
    id: r.id,
    cycleId: r.cycleId,
    n: (opts.index ?? 0) + 1,
    client: opts.clientName ?? "",
    titulo: r.titulo,
    descricao: r.descricao ?? "",
    responsavel: {
      id: r.responsavelId,
      nome: opts.responsavelNome ?? "Responsável do cliente",
      depto: "",
      email: opts.responsavelEmail ?? "",
    },
    prazo: r.prazo ?? "",
    prioridade: r.prioridade ?? "MEDIA",
    status: r.status,
    criteriosAceite: r.criteriosDeAceite ?? [],
    arquivo: r.documentoAnexado
      ? {
          id: r.documentoAnexado.id,
          nome: r.documentoAnexado.nomeArquivo,
          dataUpload: tsFromIso(r.documentoAnexado.criadoEm),
        }
      : null,
    comentarioAuditor: null,
    motivoRejeicao: r.motivoRejeicao ?? null,
    timeline: toViewTimeline(r.timeline),
  };
}

/** Período legível de um ciclo: "01/06/2025 – 30/06/2025". */
export function cyclePeriod(dataInicio?: string, dataFim?: string): string {
  const f = (iso?: string) => {
    if (!iso) return "—";
    const [y, m, d] = iso.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  };
  if (!dataInicio && !dataFim) return "—";
  return `${f(dataInicio)} – ${f(dataFim)}`;
}
