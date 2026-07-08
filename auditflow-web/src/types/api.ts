/* ============================================================
   Tipos espelhados nos DTOs do backend auditflow-api.
   Mantidos separados dos tipos de visualização (./index.ts):
   estes representam exatamente o JSON trocado com a API.
   ============================================================ */

export type Perfil = "ADMIN" | "AUDITOR" | "CLIENTE";
export type CycleStatusApi = "ABERTO" | "EM_ANDAMENTO" | "ENCERRADO";
export type PbcItemStatusApi = "PENDENTE" | "EM_REVISAO" | "APROVADO" | "REJEITADO";
export type PrioridadeApi = "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";

/* ---------- responses ---------- */

export interface UserResponse {
  id: string;
  tenantId: string;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
  criadoEm: string;
  /** Só vem na resposta de convite/criação — senha provisória a repassar ao usuário. */
  senhaProvisoria?: string | null;
}

export interface AuthResponse {
  token: string;
  senhaProvisoria: boolean;
  usuario: UserResponse;
}

export interface AuditClientResponse {
  id: string;
  tenantId: string;
  nomeEmpresa: string;
  cnpj: string;
  segmento?: string;
  site?: string;
  emailContato?: string;
  endereco?: string;
  ativo: boolean;
  auditorResponsavel?: UserResponse;
  totalCiclos?: number;
  ciclosAtivos?: number;
  criadoEm: string;
  /** Retornado apenas na criação — senha gerada para o usuário CLIENTE. */
  senhaProvisoria?: string;
}

export interface AuditCycleResponse {
  id: string;
  tenantId: string;
  auditClientId: string;
  auditorId?: string;
  titulo: string;
  tipo?: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
  status: CycleStatusApi;
  progressoPercent?: number;
  justificativaEncerramento?: string | null;
  criadoEm: string;
}

export interface DocumentResponse {
  id: string;
  pbcItemId: string;
  enviadoPor: string;
  nomeArquivo: string;
  criadoEm: string;
}

export interface TimelineEventResponse {
  timestamp: string;
  atorNome: string;
  acao: string;
  descricao?: string;
}

export interface PbcItemResponse {
  id: string;
  tenantId: string;
  cycleId: string;
  responsavelId: string;
  titulo: string;
  descricao?: string;
  prazo?: string;
  status: PbcItemStatusApi;
  prioridade?: PrioridadeApi;
  criteriosDeAceite?: string[];
  motivoRejeicao?: string;
  /** Jackson serializa o boolean `isOverdue` como `overdue`. */
  overdue?: boolean;
  daysLeft?: number;
  documentoAnexado?: DocumentResponse;
  timeline?: TimelineEventResponse[];
  criadoEm: string;
}

export interface CommentResponse {
  id: string;
  pbcItemId: string;
  autorId: string;
  texto: string;
  criadoEm: string;
}

export interface DashboardResponse {
  filaRevisao: number;
  itensAtrasados: number;
  aprovadosHoje: number;
  totalCiclosAtivos: number;
  taxaEntregaGeral: number;
  itensPorStatus: Record<string, number>;
}

export interface TenantResponse {
  id: string;
  nome: string;
  emailContato?: string | null;
  cnpj?: string | null;
  site?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  criadoEm: string;
}

export interface UpdateTenantRequest {
  nome: string;
  emailContato?: string;
  cnpj?: string;
  site?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

export interface UpdateProfileRequest {
  nome: string;
}

export interface CreateClientUserRequest {
  nome: string;
  email: string;
}

export interface ClientDocumentResponse {
  id: string;
  nomeArquivo: string;
  cicloTitulo: string;
  itemTitulo: string;
  itemStatus: PbcItemStatusApi;
  enviadoEm: string;
}

export interface AuditLogResponse {
  id: string;
  acao: string;
  descricao?: string | null;
  entidade: string;
  usuarioNome: string;
  ip?: string | null;
  criadoEm: string;
}

export interface ReportClientePerf {
  clienteId: string;
  cliente: string;
  total: number;
  pendentes: number;
  emRevisao: number;
  aprovados: number;
  rejeitados: number;
  atrasados: number;
}

export interface ReportMotivoRejeicao {
  motivo: string;
  total: number;
}

export interface ReportResponse {
  projetosTotal: number;
  projetosEncerrados: number;
  projetosAtivos: number;
  itensTotal: number;
  itensAtrasados: number;
  taxaEntrega: number;
  itensPorStatus: Record<string, number>;
  desempenhoPorCliente: ReportClientePerf[];
  maisRejeitados: ReportMotivoRejeicao[];
}

export interface AuditorLoadResponse {
  auditorId: string;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
  clientes: number;
  ciclosAtivos: number;
  pendentesRevisao: number;
  atrasados: number;
}

/* ---------- requests ---------- */

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface RegisterRequest {
  nomeEscritorio: string;
  emailContato: string;
  nomeAdmin: string;
  email: string;
  senha: string;
}

export interface ChangePasswordRequest {
  senhaAtual: string;
  novaSenha: string;
}

export interface CreateUserRequest {
  nome: string;
  email: string;
  senha?: string;
  perfil: Perfil;
}

export interface UserUpdateRequest {
  nome: string;
  perfil: Perfil;
}

export interface CreateAuditClientRequest {
  nomeEmpresa: string;
  cnpj: string;
  segmento?: string;
  site?: string;
  endereco?: string;
  /** Nome do usuário CLIENTE criado junto com a empresa. */
  nomeUsuario: string;
  email: string;
}

export interface UpdateAuditClientRequest {
  nomeEmpresa: string;
  cnpj: string;
  segmento?: string;
  site?: string;
  emailContato?: string;
  endereco?: string;
}

export interface CreateAuditCycleRequest {
  titulo: string;
  auditClientId: string;
  tipo?: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
}

export interface UpdateCycleStatusRequest {
  status: CycleStatusApi;
  forcar?: boolean;
  justificativa?: string;
}

export interface CreatePbcItemRequest {
  titulo: string;
  descricao?: string;
  responsavelId: string;
  prazo?: string;
  prioridade?: PrioridadeApi;
  criteriosDeAceite?: string[];
}

export interface ApproveRequest {
  comentario?: string;
}

export interface RejectRequest {
  motivo: string;
}

export interface CreateCommentRequest {
  texto: string;
}

export interface AssignAuditorRequest {
  auditorId: string;
}
