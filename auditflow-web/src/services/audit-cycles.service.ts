import api from "@/lib/api";
import type {
  AuditCycleResponse,
  CreateAuditCycleRequest,
  CycleStatusApi,
  UpdateCycleStatusRequest,
} from "@/types/api";

export const auditCyclesService = {
  list: (params?: { status?: CycleStatusApi; auditClientId?: string }): Promise<AuditCycleResponse[]> =>
    api.get("/api/cycles", { params }).then((r) => r.data),

  get: (id: string): Promise<AuditCycleResponse> => api.get(`/api/cycles/${id}`).then((r) => r.data),

  create: (data: CreateAuditCycleRequest): Promise<AuditCycleResponse> =>
    api.post("/api/cycles", data).then((r) => r.data),

  updateStatus: (id: string, data: UpdateCycleStatusRequest): Promise<AuditCycleResponse> =>
    api.patch(`/api/cycles/${id}/status`, data).then((r) => r.data),

  delete: (id: string): Promise<void> => api.delete(`/api/cycles/${id}`).then((r) => r.data),
};
