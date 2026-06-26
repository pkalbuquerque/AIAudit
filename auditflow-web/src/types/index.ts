/* Tipos de domínio do AuditFlow (alinhados com o backend auditflow-api). */

export type PbcStatus =
  | "PENDENTE"
  | "ENVIADO"
  | "EM_REVISAO"
  | "APROVADO"
  | "REJEITADO";

/* valores idênticos ao enum Prioridade do backend (rótulos com acento em badge.tsx) */
export type Prioridade = "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";

export type BadgeKind =
  | "atrasado"
  | "vencehoje"
  | "pendente"
  | "revisao"
  | "aprovado"
  | "rejeitado"
  | "planejamento"
  | "andamento"
  | "revisaofinal"
  | "encerrado";

export type Perfil = "manager" | "auditor";

export interface ClientUser {
  id: string;
  nome: string;
  depto: string;
  email: string;
}

export interface ArquivoEnviado {
  /** id do Document no backend — usado para download */
  id?: string;
  nome: string;
  tamanho?: number;
  dataUpload: number;
}

export type TimelineTone = "neutral" | "approved" | "rejected";

export interface TimelineEntry {
  ts: number;
  ator: string;
  acao: string;
  tone: TimelineTone;
}

export interface PbcItem {
  id: string;
  /** ciclo de origem — usado para invalidar queries após mutations */
  cycleId?: string;
  n: number;
  client: string;
  titulo: string;
  descricao: string;
  responsavel: ClientUser;
  prazo: string; // ISO yyyy-mm-dd
  prioridade: Prioridade;
  status: PbcStatus;
  criteriosAceite: string[];
  arquivo: ArquivoEnviado | null;
  comentarioAuditor: string | null;
  motivoRejeicao: string | null;
  timeline: TimelineEntry[];
}

export type CycleStatus =
  | "planejamento"
  | "andamento"
  | "revisaofinal"
  | "encerrado";

export interface AuditCycle {
  client: string;
  cycle: string;
  progress: number;
  status: CycleStatus;
  due: string;
  items: number;
  period: string;
  type: string;
}

export interface AuditClient {
  id: string;
  name: string;
  cnpj: string;
  seg: string;
  cycles: number;
  items: number;
  late: number;
  active: boolean;
  tone: string;
}

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: number;
  type: ToastType;
  text: string;
}
