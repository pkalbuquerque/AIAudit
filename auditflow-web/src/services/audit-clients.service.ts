import api from "@/lib/api";
import type {
  AssignAuditorRequest,
  AuditClientResponse,
  ClientDocumentResponse,
  CreateAuditClientRequest,
  CreateClientUserRequest,
  UpdateAuditClientRequest,
  UserResponse,
} from "@/types/api";

export const auditClientsService = {
  list: (): Promise<AuditClientResponse[]> => api.get("/api/clients").then((r) => r.data),

  get: (id: string): Promise<AuditClientResponse> =>
    api.get(`/api/clients/${id}`).then((r) => r.data),

  /** Cria a empresa + usuário CLIENTE; a resposta inclui `linkAtivacao` (contingência ao e-mail). */
  create: (data: CreateAuditClientRequest): Promise<AuditClientResponse> =>
    api.post("/api/clients", data).then((r) => r.data),

  update: (id: string, data: UpdateAuditClientRequest): Promise<AuditClientResponse> =>
    api.patch(`/api/clients/${id}`, data).then((r) => r.data),

  assignAuditor: (id: string, data: AssignAuditorRequest): Promise<AuditClientResponse> =>
    api.post(`/api/clients/${id}/assign`, data).then((r) => r.data),

  /** Usuários CLIENTE vinculados ao cliente — para atribuir como responsável de um item PBC. */
  listUsers: (id: string): Promise<UserResponse[]> =>
    api.get(`/api/clients/${id}/users`).then((r) => r.data),

  /** Documentos enviados em todos os ciclos do cliente. */
  listDocuments: (id: string): Promise<ClientDocumentResponse[]> =>
    api.get(`/api/clients/${id}/documents`).then((r) => r.data),

  /** Cria um usuário CLIENTE adicional; a resposta inclui `linkAtivacao` (contingência ao e-mail). */
  addUser: (id: string, data: CreateClientUserRequest): Promise<UserResponse> =>
    api.post(`/api/clients/${id}/users`, data).then((r) => r.data),
};
